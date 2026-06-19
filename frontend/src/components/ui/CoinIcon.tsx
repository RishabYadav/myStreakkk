import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';
import { FloatView } from './motion';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, number> = {
  xs: 18,
  sm: 22,
  md: 28,
  lg: 36,
  xl: 44,
};

interface Props {
  size?: Size | number;
  style?: StyleProp<ViewStyle>;
  float?: boolean;
}

function SpinningCoin({ px }: { px: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  const glow = px * 1.35;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const scaleX = spin.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.12, 1],
  });
  const scaleY = spin.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.88, 1, 0.88, 1],
  });

  return (
    <View style={[styles.wrap, { width: glow, height: glow }]}>
      <View style={[styles.glow, { width: glow, height: glow, borderRadius: glow / 2 }]} />
      <Animated.View
        style={{
          width: px,
          height: px,
          transform: [{ scaleX }, { scaleY }],
        }}
      >
        <Svg width={px} height={px} viewBox="0 0 48 48">
          <Defs>
            <LinearGradient id="coinFace" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFF3B0" />
              <Stop offset="0.45" stopColor={colors.gold} />
              <Stop offset="1" stopColor={colors.goldDark} />
            </LinearGradient>
            <LinearGradient id="coinRim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F5C842" />
              <Stop offset="1" stopColor="#9A6208" />
            </LinearGradient>
          </Defs>
          <Circle cx="24" cy="24" r="22" fill="url(#coinRim)" />
          <Circle cx="24" cy="24" r="18.5" fill="url(#coinFace)" />
          <Circle cx="24" cy="24" r="16" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
          <Ellipse cx="18" cy="16" rx="7" ry="4" fill="rgba(255,255,255,0.35)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function CoinIcon({ size = 'md', style, float = false }: Props) {
  const px = typeof size === 'number' ? size : SIZES[size];
  const icon = (
    <View style={style}>
      <SpinningCoin px={px} />
    </View>
  );

  if (float) {
    return (
      <FloatView distance={3} duration={2000}>
        {icon}
      </FloatView>
    );
  }

  return icon;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(245,200,66,0.24)',
  },
});
