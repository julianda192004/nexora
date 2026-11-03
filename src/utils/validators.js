/**
 * NEXORA Validators
 */

export function validateUsername(username) {
  if (!username) return 'Username is required.';
  if (username.length < 3 || username.length > 20) {
    return 'Username must be between 3 and 20 characters.';
  }
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(username)) {
    return 'Username can only contain letters, numbers, and underscores.';
  }
  return null;
}

export function validateEmail(email) {
  if (!email) return 'Email is required.';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

export function validateMediaUpload(file) {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (allowedImageTypes.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image file must be less than 10MB.';
    }
    return null;
  }

  if (allowedVideoTypes.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) {
      return 'Video file must be less than 50MB.';
    }
    return null;
  }

  return 'Unsupported file format. Please upload JPG, PNG, WEBP, GIF, or MP4.';
}
