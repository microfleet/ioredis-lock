import assert from 'node:assert'
import * as errors from '../src/errors.js'

describe('errors', () => {
  describe('LockAcquisitionError', () => {
    it('inherits from Error', () => {
      assert(new errors.LockAcquisitionError('msg') instanceof Error)
    })

    it('accepts a message', () => {
      const message = 'ErrorMessage'
      const error = new errors.LockAcquisitionError(message)

      assert.equal(error.message, message)
    })
  })

  describe('LockReleaseError', () => {
    it('inherits from Error', () => {
      assert(new errors.LockReleaseError('msg') instanceof Error)
    })

    it('accepts a message', () => {
      const message = 'ErrorMessage'
      const error = new errors.LockReleaseError(message)

      assert.equal(error.message, message)
    })
  })

  describe('LockExtendError', () => {
    it('inherits from Error', () => {
      assert(new errors.LockExtendError('msg') instanceof Error)
    })

    it('accepts a message', () => {
      const message = 'ErrorMessage'
      const error = new errors.LockExtendError(message)

      assert.equal(error.message, message)
    })
  })
})
