/**
 * Contains the potential errors thrown by a lock.
 */

/**
 * The constructor for a LockAcquisitionError. Thrown or returned when a lock
 * could not be acquired.
 *
 * @constructor
 * @extends Error
 *
 * @param {string} message The message to assign the error
 */
export class LockAcquisitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LockAcquisitionError'
  }
}

/**
 * The constructor for a LockReleaseError. Thrown or returned when a lock
 * could not be released.
 *
 * @constructor
 * @extends Error
 *
 * @param {string} message The message to assign the error
 */
export class LockReleaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LockReleaseError'
  }
}

/**
 * The constructor for a LockExtendError. Thrown or returned when a lock
 * could not be extended.
 *
 * @constructor
 * @extends Error
 *
 * @param {string} message The message to assign the error
 */
export class LockExtendError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LockExtendError'
  }
}
