export const PUSH_NOTIFICATIONS_TEMPORARILY_DISABLED = true;
export const PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE =
  'Push notifications will be enabled in the next test build.';

const PUSH_SETTINGS_NOTICE_FALLBACK =
  'Notifications could not finish connecting on this device. You can keep using the app normally and try again later.';

type PushRegistrationResult =
  | {
      reason: string;
      status: 'denied' | 'skipped';
    }
  | {
      status: 'registered';
      token: string;
    }
  | {
      message: string;
      status: 'error';
    };

type RegisterPushOptions = {
  email?: string | null;
  force?: boolean;
  ignorePreference?: boolean;
};

let pendingPushRegistrationNotice: string | null = null;

function createPushRegistrationNotice(message?: string) {
  const normalizedMessage = message?.trim();

  if (!normalizedMessage) {
    return PUSH_SETTINGS_NOTICE_FALLBACK;
  }

  return normalizedMessage;
}

function setPendingPushRegistrationNotice(message?: string) {
  pendingPushRegistrationNotice = createPushRegistrationNotice(message);
}

export function getPendingPushRegistrationNotice() {
  return pendingPushRegistrationNotice;
}

export function clearPendingPushRegistrationNotice() {
  pendingPushRegistrationNotice = null;
}

export async function registerPushNotificationsForUser(
  _userId: string,
  _options: RegisterPushOptions = {}
): Promise<PushRegistrationResult> {
  setPendingPushRegistrationNotice(PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE);

  return {
    reason: PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE,
    status: 'skipped',
  };
}

export async function unregisterPushNotificationsForUser(_userId: string) {
  clearPendingPushRegistrationNotice();

  return {
    reason: PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE,
    status: 'skipped' as const,
  };
}
