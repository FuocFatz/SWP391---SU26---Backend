import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_AVATAR_BYTES, validateAvatarFile } from './avatarValidation.js';

test('avatar validation accepts the supported image types', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(validateAvatarFile({ type, size: 1024 }), '');
  }
});

test('avatar validation rejects unsafe types, empty files, and oversized files', () => {
  assert.match(validateAvatarFile({ type: 'image/svg+xml', size: 100 }), /JPG, PNG, or WebP/);
  assert.match(validateAvatarFile({ type: 'image/png', size: 0 }), /empty/);
  assert.match(validateAvatarFile({ type: 'image/png', size: MAX_AVATAR_BYTES + 1 }), /5 MB/);
});
