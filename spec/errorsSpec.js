const assert = require('assert');
const errors = require('../lib/errors');

describe('errors', () => {
  describe('LockAcquisitionError', () => {
    it('inherits from Error', () => {
      assert(new errors.LockAcquisitionError() instanceof Error);
    });

    it('accepts a message', () => {
      const message = 'ErrorMessage';
      const error = new errors.LockAcquisitionError(message);

      assert.equal(error.message, message);
    });
  });

  describe('LockReleaseError', () => {
    it('inherits from Error', () => {
      assert(new errors.LockReleaseError() instanceof Error);
    });

    it('accepts a message', () => {
      const message = 'ErrorMessage';
      const error = new errors.LockReleaseError(message);

      assert.equal(error.message, message);
    });
  });

  describe('LockExtendError', () => {
    it('inherits from Error', () => {
      assert(new errors.LockExtendError() instanceof Error);
    });

    it('accepts a message', () => {
      const message = 'ErrorMessage';
      const error = new errors.LockExtendError(message);

      assert.equal(error.message, message);
    });
  });
});
