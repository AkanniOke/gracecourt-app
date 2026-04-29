function getNormalizedErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.trim().toLowerCase();
  }

  if (typeof error === 'string') {
    return error.trim().toLowerCase();
  }

  return '';
}

export function getFriendlyActionErrorMessage(error: unknown, fallback: string) {
  const normalizedMessage = getNormalizedErrorMessage(error);

  if (!normalizedMessage) {
    return fallback;
  }

  if (
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('network error')
  ) {
    return 'Please check your internet connection and try again.';
  }

  if (
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('socket hang up')
  ) {
    return 'The request took too long. Please try again in a moment.';
  }

  if (
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('permission denied') ||
    normalizedMessage.includes('not allowed') ||
    normalizedMessage.includes('not authorized') ||
    normalizedMessage.includes('forbidden') ||
    normalizedMessage.includes('jwt')
  ) {
    return fallback;
  }

  return fallback;
}

export function getFriendlyAuthErrorMessage(error: unknown, fallback: string) {
  const normalizedMessage = getNormalizedErrorMessage(error);

  if (!normalizedMessage) {
    return fallback;
  }

  if (
    normalizedMessage.includes('invalid login credentials') ||
    normalizedMessage.includes('invalid credentials')
  ) {
    return 'Incorrect email or password. Please try again.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (
    normalizedMessage.includes('user already registered') ||
    normalizedMessage.includes('already been registered')
  ) {
    return 'An account already exists for this email. Please log in instead.';
  }

  if (
    normalizedMessage.includes('password should be at least') ||
    normalizedMessage.includes('weak password')
  ) {
    return 'Use a stronger password with at least 6 characters.';
  }

  if (normalizedMessage.includes('unable to validate email address')) {
    return 'Enter a valid email address and try again.';
  }

  return getFriendlyActionErrorMessage(error, fallback);
}
