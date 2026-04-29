import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  GraceCourtColorPalettes,
  type GraceCourtColorPalette,
  type GraceCourtThemeName,
} from '@/constants/gracecourt-ui';
import {
  DEFAULT_NOTIFICATIONS_ENABLED,
  DEFAULT_THEME,
  getStoredNotificationsEnabled,
  getStoredThemePreference,
  setStoredNotificationsEnabled,
  setStoredThemePreference,
} from '@/lib/settings-storage';

type SettingsContextValue = {
  colors: GraceCourtColorPalette;
  notificationsEnabled: boolean;
  selectedTheme: GraceCourtThemeName;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setSelectedTheme: (theme: GraceCourtThemeName) => Promise<void>;
  settingsReady: boolean;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settingsReady, setSettingsReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(
    DEFAULT_NOTIFICATIONS_ENABLED
  );
  const [selectedTheme, setSelectedThemeState] = useState<GraceCourtThemeName>(DEFAULT_THEME);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const [storedNotificationsEnabled, storedTheme] = await Promise.all([
          getStoredNotificationsEnabled(),
          getStoredThemePreference(),
        ]);

        if (!mounted) {
          return;
        }

        setNotificationsEnabledState(storedNotificationsEnabled);
        setSelectedThemeState(storedTheme);
      } catch (error) {
        console.error('Failed to load GraceCourt settings.', error);
      } finally {
        if (mounted) {
          setSettingsReady(true);
        }
      }
    };

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    await setStoredNotificationsEnabled(enabled);
  }, []);

  const setSelectedTheme = useCallback(async (theme: GraceCourtThemeName) => {
    setSelectedThemeState(theme);
    await setStoredThemePreference(theme);
  }, []);

  const value = useMemo(
    () => ({
      colors: GraceCourtColorPalettes[selectedTheme],
      notificationsEnabled,
      selectedTheme,
      setNotificationsEnabled,
      setSelectedTheme,
      settingsReady,
    }),
    [
      notificationsEnabled,
      selectedTheme,
      setNotificationsEnabled,
      setSelectedTheme,
      settingsReady,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside SettingsProvider.');
  }

  return context;
}
