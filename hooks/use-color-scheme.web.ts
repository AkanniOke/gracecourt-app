import { useAppSettings } from '@/lib/settings-context';

export function useColorScheme() {
  const { selectedTheme } = useAppSettings();

  return selectedTheme;
}
