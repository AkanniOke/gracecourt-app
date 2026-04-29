import { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { InteractivePressable } from '@/components/interactive-pressable';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
} from '@/constants/gracecourt-ui';

type AuthActionButtonProps = PropsWithChildren<{
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}>;

export function AuthActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: AuthActionButtonProps) {
  const primary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <InteractivePressable
      accessibilityRole="button"
      activeOpacity={isDisabled ? 1 : 0.92}
      onPress={onPress}
      scaleTo={isDisabled ? 1 : 0.98}
      style={[
        styles.button,
        primary ? styles.primaryButton : styles.secondaryButton,
        isDisabled && styles.buttonDisabled,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={primary ? GraceCourtColors.surface : GraceCourtColors.accent} size="small" />
        ) : null}
        <Text style={[styles.label, primary ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      </View>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: GraceCourtRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: GraceCourtColors.accent,
    ...GraceCourtShadows.accent,
  },
  secondaryButton: {
    backgroundColor: GraceCourtColors.surface,
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    ...GraceCourtShadows.subtle,
  },
  buttonDisabled: {
    opacity: 0.82,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryLabel: {
    color: GraceCourtColors.surface,
  },
  secondaryLabel: {
    color: GraceCourtColors.accent,
  },
});
