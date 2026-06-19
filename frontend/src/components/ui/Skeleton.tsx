import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, space } from '../../theme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
  circle?: boolean;
}

export function Skeleton({ width = '100%', height = 16, style, circle }: Props) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const borderRadius = circle ? height / 2 : radius.sm;

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function AppLoadingSkeleton() {
  return (
    <View style={styles.screen}>
      <Skeleton height={180} style={{ borderRadius: radius.xl, marginBottom: space[4] }} />
      <Skeleton height={120} style={{ marginBottom: space[3] }} />
      <Skeleton height={88} style={{ marginBottom: space[3] }} />
      <Skeleton height={88} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#E2E8F0' },
  screen: {
    flex: 1,
    backgroundColor: colors.surface.canvas,
    padding: space[4],
    paddingTop: space[6],
  },
});
