import { PropsWithChildren, useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type InteractivePressableProps = PropsWithChildren<
  PressableProps & {
    activeOpacity?: number;
    scaleTo?: number;
    style?: StyleProp<ViewStyle>;
  }
>;

export function InteractivePressable({
  activeOpacity = 0.94,
  children,
  onPressIn,
  onPressOut,
  scaleTo = 0.985,
  style,
  ...props
}: InteractivePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (nextScale: number, nextOpacity: number) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: nextScale,
        useNativeDriver: true,
        speed: 28,
        bounciness: 4,
      }),
      Animated.timing(opacity, {
        toValue: nextOpacity,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        animateTo(scaleTo, activeOpacity);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1, 1);
        onPressOut?.(event);
      }}
      style={[
        style,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}>
      {children}
    </AnimatedPressable>
  );
}
