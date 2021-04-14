import { v1 } from 'uuid'
import { LockAcquisitionError, LockReleaseError, LockExtendError } from './errors'
import { delay } from 'bluebird'
import * as scripts from './scripts'
import type Redis from 'ioredis'

export interface Config {
  timeout: number
  retries: number
  delay: number
}

declare module 'ioredis' {
  interface Commands {
    delifequal(key: string, id: string): Promise<number>
    pexpireifequal(key: string, id: string, seconds: number): Promise<number>
  }
}

/**
 * @class Lock
 */
export class Lock {
  static _acquiredLocks: Set<Lock> = new Set()

  private readonly _id: string = v1()
  private readonly _client: Redis.Redis | Redis.Cluster
  private _locked = false
  private _key: string | null = null

  public readonly config: Config = {
    timeout: 10000,
    retries: 0,
    delay: 50
  }

  /**
   * The constructor for a Lock object. Accepts both a redis client, as well as
   * an options object with the following properties: timeout, retries and delay.
   * Any options not supplied are subject to the current defaults.
   * @constructor
   *
   * @param {RedisClient} client  The node_redis client to use
   * @param {object}      options
   *
   * @property {int} timeout Time in milliseconds before which a lock expires
   *                         (default: 10000 ms)
   * @property {int} retries Maximum number of retries in acquiring a lock if the
   *                         first attempt failed (default: 0)
   * @property {int} delay   Time in milliseconds to wait between each attempt
   *                         (default: 50 ms)
   */
  constructor(client: Redis.Redis | Redis.Cluster, options?: Partial<Config>) {
    this._client = client
    if (options && typeof options === 'object') {
      Object.assign(this.config, options)
    }

    this._setupClient()
  }

  /**
   * Attempts to acquire a lock, given a key, and an optional callback function.
   * If the initial lock fails, additional attempts will be made for the
   * configured number of retries, and padded by the delay. The callback is
   * invoked with an error on failure, and returns a promise if no callback is
   * supplied. If invoked in the context of a promise, it may throw a
   * LockAcquisitionError.
   *
   * @param key The redis key to use for the lock
   */
  async acquire(key: string): Promise<void> {
    if (this._locked) {
      throw new LockAcquisitionError('Lock already held')
    }

    try {
      await this._attemptLock(key, this.config.retries)
      this._locked = true
      this._key = key
      Lock._acquiredLocks.add(this)
    } catch (err) {
      if (!(err instanceof LockAcquisitionError)) {
        throw new LockAcquisitionError(err.message)
      }

      throw err
    }
  }

  /**
   * Attempts to extend the lock
   * @param expire in `timeout` seconds
   */
  async extend(time: number = this.config.timeout): Promise<void> {
    const key = this._key
    const client = this._client

    if (!this._locked || !key) {
      throw new LockExtendError('Lock has not been acquired')
    }

    try {
      const res = await client.pexpireifequal(key, this._id, time)
      if (res) {
        return
      }

      this._locked = false
      this._key = null
      Lock._acquiredLocks.delete(this)
      throw new LockExtendError(`Lock on "${key}" had expired`)
    } catch (err) {
      if (!(err instanceof LockExtendError)) {
        throw new LockExtendError(err.message)
      }

      throw err
    }
  }

  /**
   * Attempts to release the lock, and accepts an optional callback function.
   * The callback is invoked with an error on failure, and returns a promise
   * if no callback is supplied. If invoked in the context of a promise, it may
   * throw a LockReleaseError.
   */
  async release(): Promise<void> {
    const key = this._key
    const client = this._client

    if (!this._locked || !key) {
      throw new LockReleaseError('Lock has not been acquired')
    }

    try {
      const res = await client.delifequal(key, this._id)

      this._locked = false
      this._key = null
      Lock._acquiredLocks.delete(this)

      if (!res) {
        throw new LockReleaseError(`Lock on "${key}" had expired`)
      }
    } catch (err) {
      // Wrap redis errors
      if (!(err instanceof LockReleaseError)) {
        throw new LockReleaseError(err.message)
      }

      throw err
    }
  }

  /**
   * @private
   */
  private _setupClient(): void {
    const client = this._client

    if (!client.delifequal) {
      client.defineCommand('delifequal', {
        lua: scripts.delifequal,
        numberOfKeys: 1,
      })
    }

    if (!client.pexpireifequal) {
      client.defineCommand('pexpireifequal', {
        lua: scripts.pexpireifequal,
        numberOfKeys: 1,
      })
    }
  }

  /**
   * Attempts to acquire the lock, and retries upon failure if the number of
   * remaining retries is greater than zero. Each attempt is padded by the
   * lock's configured retry delay.
   *
   * @param {string} key     The redis key to use for the lock
   * @param {int}    retries Number of remaining retries
   *
   * @returns {Promise}
   */
  async _attemptLock(key: string, retries: number): Promise<void> {
    const client = this._client
    const ttl = this.config.timeout
    const res = await client.set(key, this._id, 'PX', ttl, 'NX')

    if (!res && retries < 1) {
      throw new LockAcquisitionError(`Could not acquire lock on "${key}"`)
    } else if (res) {
      return
    }

    await delay(this.config.delay)
    return this._attemptLock(key, retries - 1)
  }
}
