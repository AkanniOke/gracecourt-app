import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getStoredNotificationsEnabled } from '@/lib/settings-storage';
import { supabase } from '@/lib/supabase';

const STORED_EXPO_PUSH_TOKEN_KEY = 'gracecourt.expoPushToken';
const STORED_PUSH_TOKEN_USER_ID_KEY = 'gracecourt.pushTokenUserId';
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

const registrationAttempts = new Set<string>();
let pendingPushRegistrationNotice: string | null = null;
let notificationHandlerInstalled = false;

function getEasProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function notificationLog(message: string, payload?: unknown) {
  if (typeof payload === 'undefined') {
    console.log(message);
    return;
  }

  console.log(message, payload);
}

function notificationError(message: string, payload?: unknown) {
  if (typeof payload === 'undefined') {
    console.error(message);
    return;
  }

  console.error(message, payload);
}

function installNotificationHandler() {
  if (notificationHandlerInstalled) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  notificationHandlerInstalled = true;
  notificationLog('Push notifications: notification handler installed for manual registration flow.');
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    rawError: error,
  };
}

function getNormalizedEmail(email?: string | null) {
  const trimmedEmail = email?.trim().toLowerCase() ?? '';
  return trimmedEmail || null;
}

function createPushRegistrationNotice(message?: string) {
  const normalizedMessage = message?.trim();

  if (!normalizedMessage) {
    return PUSH_SETTINGS_NOTICE_FALLBACK;
  }

  if (/not available in this build/i.test(normalizedMessage)) {
    return 'Notifications are not available in this build yet. You can keep using the app normally and try again later.';
  }

  if (/permission/i.test(normalizedMessage)) {
    return 'Notification permission is currently unavailable. You can keep using the app normally and try again from Settings later.';
  }

  return `${PUSH_SETTINGS_NOTICE_FALLBACK} Details: ${normalizedMessage}`;
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

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    notificationLog('Push notifications: Android notification channel not needed on this platform.', {
      platform: Platform.OS,
    });
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    importance: Notifications.AndroidImportance.MAX,
    lightColor: '#0A2E73',
    name: 'Default',
    vibrationPattern: [0, 250, 250, 250],
  });

  notificationLog('Push notifications: Android notification channel is ready.', {
    channelId: 'default',
  });
}

async function getNotificationPermissionStatus() {
  const existingPermission = await Notifications.getPermissionsAsync();
  notificationLog('Push notifications: existing permission status.', {
    canAskAgain: existingPermission.canAskAgain,
    granted: existingPermission.granted,
    iosStatus: existingPermission.ios?.status,
    status: existingPermission.status,
  });

  if (existingPermission.status === 'granted') {
    return existingPermission.status;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  notificationLog('Push notifications: requested permission status.', {
    canAskAgain: requestedPermission.canAskAgain,
    granted: requestedPermission.granted,
    iosStatus: requestedPermission.ios?.status,
    status: requestedPermission.status,
  });
  return requestedPermission.status;
}

async function removeStoredPushTokenRecord(userId: string, expoPushToken: string) {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', expoPushToken);

  if (error) {
    throw error;
  }
}

async function savePushToken(userId: string, email: string | null, expoPushToken: string) {
  const normalizedEmail = getNormalizedEmail(email);
  const storedToken = await AsyncStorage.getItem(STORED_EXPO_PUSH_TOKEN_KEY);
  const storedUserId = await AsyncStorage.getItem(STORED_PUSH_TOKEN_USER_ID_KEY);

  const payload = {
    email: normalizedEmail,
    expo_push_token: expoPushToken,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
    user_id: userId,
  };
  notificationLog('Push notifications: saving Expo push token to Supabase.', payload);

  const { data, error } = await supabase
    .from('push_tokens')
    .upsert(payload, {
      onConflict: 'user_id,expo_push_token',
    })
    .select('id, user_id, expo_push_token, platform, updated_at');

  if (error) {
    notificationError('Push notifications: failed to save Expo push token to Supabase.', error);
    throw error;
  }

  if (storedToken && storedUserId === userId && storedToken !== expoPushToken) {
    try {
      await removeStoredPushTokenRecord(userId, storedToken);
    } catch (cleanupError) {
      notificationError('Push notifications: failed to remove the previous Expo push token row.', cleanupError);
    }
  }

  await AsyncStorage.setItem(STORED_EXPO_PUSH_TOKEN_KEY, expoPushToken);
  await AsyncStorage.setItem(STORED_PUSH_TOKEN_USER_ID_KEY, userId);
  notificationLog('Push notifications: Supabase save result.', {
    rows: data,
    storedLocally: true,
  });
}

export async function registerPushNotificationsForUser(
  userId: string,
  options: RegisterPushOptions = {}
): Promise<PushRegistrationResult> {
  try {
    if (PUSH_NOTIFICATIONS_TEMPORARILY_DISABLED) {
      notificationLog('Push notifications: registration skipped because native push setup is temporarily disabled.');
      return {
        reason: PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE,
        status: 'skipped',
      };
    }

    notificationLog('Push notifications: starting registration attempt.', {
      executionEnvironment: Constants.executionEnvironment,
      force: options.force ?? false,
      ignorePreference: options.ignorePreference ?? false,
      isDevice: Device.isDevice,
      platform: Platform.OS,
      userId,
    });

    if (!userId) {
      notificationLog('Push notifications: skipped registration because no userId was provided.');
      return {
        reason: 'Sign in to finish connecting notifications on this device.',
        status: 'skipped',
      };
    }

    if (!options.ignorePreference) {
      const notificationsEnabled = await getStoredNotificationsEnabled();

      if (!notificationsEnabled) {
        notificationLog('Push notifications: skipped registration because notifications are disabled in Settings.', {
          userId,
        });
        return { reason: 'Notifications are disabled in Settings.', status: 'skipped' };
      }
    }

    if (!options.force && registrationAttempts.has(userId)) {
      notificationLog('Push notifications: skipped duplicate registration attempt for this session.', {
        userId,
      });
      return { reason: 'Push notification registration already ran for this user.', status: 'skipped' };
    }

    registrationAttempts.add(userId);

    if (Platform.OS === 'web') {
      notificationLog('Push notifications: skipped registration on web.', { userId });
      return { reason: 'Expo push notifications are not registered on web.', status: 'skipped' };
    }

    if (Constants.executionEnvironment === 'storeClient') {
      notificationLog('Push notifications: skipped registration in Expo Go/store client.', {
        executionEnvironment: Constants.executionEnvironment,
        userId,
      });
      return {
        reason:
          'Notifications are not available in Expo Go. Your preference was saved for a development build or APK.',
        status: 'skipped',
      };
    }

    if (!Device.isDevice) {
      notificationLog('Push notifications: skipped registration because this is not a physical device.', {
        userId,
      });
      return {
        reason: 'Push notifications can only be enabled on a physical device.',
        status: 'skipped',
      };
    }

    const projectId = getEasProjectId();
    notificationLog('Push notifications: resolved EAS projectId.', {
      easConfigProjectId: Constants.easConfig?.projectId ?? null,
      expoConfigProjectId: Constants.expoConfig?.extra?.eas?.projectId ?? null,
      isDevice: Device.isDevice,
      projectId: projectId ?? null,
      userId,
    });

    if (!projectId) {
      const message =
        'Notifications are not available in this build yet. Please try again in the APK or development build.';

      notificationError('Push notifications: missing EAS projectId for Expo push token registration.', {
        executionEnvironment: Constants.executionEnvironment,
        userId,
      });
      setPendingPushRegistrationNotice(message);
      return {
        message,
        status: 'error',
      };
    }

    installNotificationHandler();
    await ensureAndroidNotificationChannel();

    const permissionStatus = await getNotificationPermissionStatus();
    notificationLog('Push notifications: final permission status.', {
      permissionStatus,
      userId,
    });

    if (permissionStatus !== 'granted') {
      return { reason: 'Notification permission was not granted.', status: 'denied' };
    }

    notificationLog('Push notifications: requesting Expo push token.', {
      projectId,
      userId,
    });

    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    notificationLog('Push notifications: getExpoPushTokenAsync result.', {
      pushToken,
      userId,
    });
    notificationLog('Push notifications: Expo push token generated.', {
      projectId,
      token: pushToken.data,
      userId,
    });

    await savePushToken(userId, options.email ?? null, pushToken.data);
    clearPendingPushRegistrationNotice();

    return {
      status: 'registered',
      token: pushToken.data,
    };
  } catch (error) {
    let errorMessage = 'We could not finish enabling notifications on this device. Please try again.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    notificationError('Push notifications: failed to register Expo push token.', {
      error: getErrorDetails(error),
      userId,
    });
    setPendingPushRegistrationNotice(errorMessage);

    return {
      message: errorMessage,
      status: 'error',
    };
  }
}

export async function unregisterPushNotificationsForUser(userId: string) {
  registrationAttempts.delete(userId);
  clearPendingPushRegistrationNotice();

  const storedToken = await AsyncStorage.getItem(STORED_EXPO_PUSH_TOKEN_KEY);

  if (!storedToken) {
    notificationLog('Push notifications: no stored Expo push token found during unregister.', { userId });
    return { reason: 'No local Expo push token is stored for this device.', status: 'skipped' };
  }

  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', storedToken);

  if (error) {
    throw error;
  }

  await AsyncStorage.removeItem(STORED_EXPO_PUSH_TOKEN_KEY);
  await AsyncStorage.removeItem(STORED_PUSH_TOKEN_USER_ID_KEY);
  notificationLog('Push notifications: removed Expo push token from Supabase successfully.', {
    platform: Platform.OS,
    token: storedToken,
    userId,
  });

  return { status: 'removed' };
}
