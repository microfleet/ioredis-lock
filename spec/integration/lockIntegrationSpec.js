/* global describe, beforeEach, afterEach, it */

/**
 * The following tests are designed to run against a live redis-server instance.
 */

const assert = require('assert');
const Redis = require('ioredis');

describe('lock', () => {
  const client = new Redis();
  const redislock = require('../../lib/redislock');
  const Lock = require('../../lib/lock');

  const {
    LockAcquisitionError,
    LockReleaseError,
    LockExtendError,
  } = redislock;

  const key = 'integration:test';
  let lock;

  after(async () => {
    await client.quit();
  });

  beforeEach(() => {
    lock = redislock.createLock(client);
  });

  afterEach(async () => {
    await client.del(key);
  });

  it('can be used multiple times', async () => {
    await lock.acquire(key);
    await lock.release();
    await lock.acquire(key);
    const res = await client.get(key);

    assert.equal(res, lock._id);
  });

  describe('acquire', () => {
    it('sets the key if not held by another lock', async () => {
      await lock.acquire(key);
      const res = await client.get(key);

      assert.equal(res, lock._id);
      assert.equal(lock._locked, true);
      assert.equal(lock._key, key);
    });

    it('throws an error if the key is already in use', async () => {
      const lock2 = redislock.createLock(client);

      await lock.acquire(key);
      try {
        await lock2.acquire(key);
      } catch (err) {
        assert(err instanceof LockAcquisitionError);
        assert.equal(err.message, 'Could not acquire lock on "integration:test"');
        assert.equal(lock2._locked, false);
        assert.equal(lock2._key, null);
        return;
      }

      throw new Error('was able to acquire lock');
    });
  });

  describe('extend', () => {
    it('extends the lock if it has not expired', async () => {
      await lock.acquire(key);

      const ttl = await client.pttl(key);
      assert(ttl > 9900 && ttl < 10000);

      await lock.extend(30000);
      const nextTtl = await client.pttl(key);
      assert(nextTtl > 29900 && nextTtl < 30000);
    });

    it('throw an error if the key no longer belongs to the lock', async () => {
      await lock.acquire(key);
      await client.set(key, 'mismatch');

      try {
        await lock.extend();
      } catch (err) {
        assert(err instanceof LockExtendError);
        assert.equal(err.message, 'Lock on "integration:test" had expired');
        assert.equal(lock._locked, false);
        assert.equal(lock._key, null);
        return;
      }

      throw new Error('test did not fail');
    });
  });

  describe('release', () => {
    it('deletes the key if held by the current lock', async () => {
      await lock.acquire(key);
      await lock.release();
      const res = await client.get(key);

      assert.equal(res, null);
      assert.equal(lock._locked, false);
      assert.equal(lock._key, null);
    });

    it('throws an error if the key no longer belongs to the lock', async () => {
      await lock.acquire(key);
      await client.set(key, 'mismatch');
      try {
        await lock.release();
      } catch (err) {
        assert(err instanceof LockReleaseError);
        assert.equal(err.message, 'Lock on "integration:test" had expired');
        assert.equal(lock._locked, false);
        assert.equal(lock._key, null);
        return;
      }

      throw new Error('test did not throw');
    });
  });

  describe('extend', () => {
    it('extends the key ttl if held by the current lock', async () => {
      await lock.acquire(key);
      await lock.extend(10000);
      const ttl = await client.pttl(key);
      // Compensate for delay
      assert(ttl >= 9000 && ttl <= 10000, ttl);

      const res = await client.get(key);

      assert.equal(res, lock._id);
      assert.equal(lock._locked, true);
      assert.equal(lock._key, key);
    });

    it('throws an error if the key no longer belongs to the lock', async () => {
      await lock.acquire(key);
      await client.set(key, 'mismatch');
      try {
        await lock.extend(10000);
      } catch (err) {
        assert(err instanceof LockExtendError);
        assert.equal(err.message, 'Lock on "integration:test" had expired');
        assert.equal(lock._locked, false);
        assert.equal(lock._key, null);
        return;
      }

      throw new Error('test did not fail');
    });
  });

  describe('getAcquiredLocks', () => {
    it('returns an array of locks', async () => {
      const oldLockCount = redislock.getAcquiredLocks().length;
      await lock.acquire(key);
      assert.equal(redislock.getAcquiredLocks().length, oldLockCount + 1);
      let recount = 0;
      redislock.getAcquiredLocks().forEach((l) => {
        recount += 1;
        assert(l instanceof Lock);
      });

      assert.equal(recount, oldLockCount + 1);
      await lock.release();
      assert.equal(redislock.getAcquiredLocks().length, oldLockCount);
    });
  });
});
