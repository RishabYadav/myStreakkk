import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
  PressableProps,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
}

export default function PressableScale({
  children,
  style,
  scaleTo = 0.98,
  haptic = true,
  onPress,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const flat = StyleSheet.flatten(style) ?? {};

  const pressableStyle: ViewStyle = {
    ...(flat.flex !== undefined ? { flex: flat.flex as number } : {}),
    ...(flat.alignSelf ? { alignSelf: flat.alignSelf } : {}),
    ...(flat.width !== undefined ? { width: flat.width as number | `${number}%` } : {}),
    ...(flat.maxWidth !== undefined ? { maxWidth: flat.maxWidth as number | `${number}%` } : {}),
  };

  const animate = (to: number) => {
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      {...rest}
      style={Object.keys(pressableStyle).length ? pressableStyle : undefined}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
