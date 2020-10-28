import { Cluster, Redis } from "ioredis";
export {
  LockAcquisitionError,
  LockExtendError,
  LockReleaseError,
} from "../src/errors";
export import Lock = require("../src/lock");

/** redislock offers both atomic acquire and release operations,
 * avoiding race conditions among clients, as well as the need for lock-specific redis connections.
 * Lock creation requires a node_redis client,
 * and accepts an object specifying the following three options: */
export interface LockOption {
  /** timeout Time in milliseconds before which a lock expires
   * (default: 10000 ms) */
  timeout: number;
  /** retries Maximum number of retries in acquiring a lock if the first attempt failed
   * (default: 0) */
  retries: number;
  /** delay   Time in milliseconds to wait between each attempt
   * (default: 50 ms) */
  delay: number;
}

/** Creates and returns a new Lock instance,
 * configured for use with the supplied redis client, as well as options,
 * if provided. The options object may contain following three keys,
 * as outlined at the start of the documentation: timeout, retries and delay. */
export function createLock(client: Redis | Cluster, option: LockOption): Lock;

/** Sets the default options to be used by any new lock created by redislock.
 * Only available options are modified, and all other keys are ignored. */
export function setDefaults(option: LockOption): void;

/** Returns an array of currently active/acquired locks. */
export function getAcquiredLocks(): Set<Lock>;
