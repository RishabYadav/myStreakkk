import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';

type BaseProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  delay?: number;
};

export function BreatheView({
  children,
  style,
  duration = 2400,
  delay = 0,
  min = 0.35,
  max = 1,
}: BaseProps & { min?: number; max?: number }) {
  const opacity = useRef(new Animated.Value(max)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: min,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: max,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [opacity, duration, delay, min, max]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

export function FloatView({
  children,
  style,
  duration = 2200,
  delay = 0,
  distance = 5,
}: BaseProps & { distance?: number }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -distance,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [translateY, duration, delay, distance]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export function PulseScale({
  children,
  style,
  duration = 1500,
  delay = 0,
  min = 1,
  max = 1.08,
}: BaseProps & { min?: number; max?: number }) {
  const scale = useRef(new Animated.Value(min)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: max,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: min,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [scale, duration, delay, min, max]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

export function WiggleView({
  children,
  style,
  duration = 2800,
  delay = 0,
  angle = 6,
}: BaseProps & { angle?: number }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: duration / 4,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: duration / 4,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [rotate, duration, delay]);

  const spin = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [`-${angle}deg`, '0deg', `${angle}deg`],
  });

  return (
    <Animated.View style={[style, { transform: [{ rotate: spin }] }]}>
      {children}
    </Animated.View>
  );
}

export function ShimmerBand({
  style,
  duration = 2800,
  bandWidth = 72,
}: {
  style?: StyleProp<ViewStyle>;
  duration?: number;
  bandWidth?: number;
}) {
  const translateX = useRef(new Animated.Value(-bandWidth)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 420,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translateX, duration, bandWidth]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shimmer,
        { width: bandWidth, transform: [{ translateX }, { skewX: '-18deg' }] },
        style,
      ]}
    />
  );
}

export function LiveDot({
  color,
  size = 8,
  style,
}: {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const core = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    const coreLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(core, {
          toValue: 0.55,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(core, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    ringLoop.start();
    coreLoop.start();
    return () => {
      ringLoop.stop();
      coreLoop.stop();
    };
  }, [pulse, core]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <View style={[styles.liveDotWrap, { width: size * 2.5, height: size * 2.5 }, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: core,
        }}
      />
    </View>
  );
}

export function AnimatedProgressBar({
  pct,
  fillColor,
  trackColor,
  height = 6,
  style,
}: {
  pct: number;
  fillColor: string;
  trackColor: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const widthAnim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: pct,
      useNativeDriver: false,
      speed: 14,
      bounciness: 4,
    }).start();
  }, [pct, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressTrack, { height, backgroundColor: trackColor }, style]}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: fillColor, height }]} />
    </View>
  );
}

export function CarouselDot({
  active,
  activeColor,
  inactiveColor,
}: {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const width = useRef(new Animated.Value(active ? 20 : 6)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: active ? 20 : 6,
      useNativeDriver: false,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [active, width]);

  return (
    <Animated.View
      style={{
        width,
        height: 6,
        borderRadius: 3,
        backgroundColor: active ? activeColor : inactiveColor,
      }}
    />
  );
}

export function FadeSlideIn({
  children,
  index = 0,
  style,
}: BaseProps & { index?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: index * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 90,
        speed: 14,
        bounciness: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  liveDotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
  },
});
