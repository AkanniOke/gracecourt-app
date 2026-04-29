import { PropsWithChildren } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

type KeyboardSafeScrollViewProps = PropsWithChildren<
  ScrollViewProps & {
    avoidingBehavior?: 'height' | 'position' | 'padding';
    dismissOnTap?: boolean;
    keyboardVerticalOffset?: number;
  }
>;

export function KeyboardSafeScrollView({
  avoidingBehavior,
  contentContainerStyle,
  children,
  dismissOnTap = true,
  keyboardDismissMode,
  keyboardShouldPersistTaps,
  keyboardVerticalOffset = 0,
  style,
  ...props
}: KeyboardSafeScrollViewProps) {
  const scrollView = (
    <ScrollView
      {...props}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      contentInsetAdjustmentBehavior="always"
      keyboardDismissMode={keyboardDismissMode ?? (Platform.OS === 'ios' ? 'interactive' : 'on-drag')}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}
      showsVerticalScrollIndicator={false}
      style={[styles.scrollView, style]}>
      {children}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      behavior={avoidingBehavior ?? (Platform.OS === 'ios' ? 'padding' : 'height')}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.container}>
      {dismissOnTap ? (
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          {scrollView}
        </TouchableWithoutFeedback>
      ) : (
        scrollView
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
