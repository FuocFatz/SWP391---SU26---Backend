export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

export function validateAvatarFile(file) {
  if (!file) return 'Choose an avatar image.';
  if (!AVATAR_TYPES.includes(file.type)) return 'Avatar must be a JPG, PNG, or WebP image.';
  if (file.size <= 0) return 'Avatar image is empty.';
  if (file.size > MAX_AVATAR_BYTES) return 'Image must not exceed 5 MB.';
  return '';
}
