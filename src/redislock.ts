/**
 * redislock exposes a total of two functions: createLock,
 * and getActiveLocks.
 */

import { Lock, Config } from './lock'
export * from './errors'

export { Config }

/**
 * Returns a new Lock instance, configured for use with the supplied redis
 * client, as well as options, if provided.
 */
export function createLock(...args: ConstructorParameters<typeof Lock>): Lock {
  return new Lock(...args)
}

/**
 * Returns an array of currently active/acquired locks.
 */
export function getAcquiredLocks(): Lock[] {
  return Array.from(Lock._acquiredLocks)
}
