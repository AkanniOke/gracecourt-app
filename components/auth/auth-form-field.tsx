import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';

import {
  GraceCourtColors,
  GraceCourtRadius,
} from '@/constants/gracecourt-ui';

type AuthFormFieldProps = TextInputProps & {
  label: string;
};

export function AuthFormField({ label, style, ...props }: AuthFormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={GraceCourtColors.textMuted}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.textPrimary,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.medium,
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: GraceCourtColors.textPrimary,
  },
});
