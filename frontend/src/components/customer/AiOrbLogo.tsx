import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { BreatheView, PulseScale } from '../ui/motion';

interface Props {
  size?: number;
}

export default function AiOrbLogo({ size = 56 }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const ringSize = size + 8;
  const outerSize = size + 18;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ringOffset = (outerSize - ringSize) / 2;

  return (
    <View style={{ width: outerSize, height: outerSize }}>
      <BreatheView
        duration={2000}
        min={0.35}
        max={0.75}
        style={[
          styles.glow,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            top: ringOffset,
            left: ringOffset,
            transform: [{ rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={['#34D399', '#14B8A6', '#6366F1', '#34D399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: ringSize / 2, opacity: 0.85 }]}
        />
      </Animated.View>
      <View style={[styles.coreWrap, { width: outerSize, height: outerSize }]}>
        <PulseScale min={0.94} max={1.06} duration={1400}>
          <LinearGradient
            colors={['#059669', '#0D9488', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.core, { width: size, height: size, borderRadius: size / 2 }]}
          >
            <Svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24">
              <Path
                d="M12 2l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 14.8 7.8 16l1.7-5.2L5 7.5h5.2L12 2z"
                fill="rgba(255,255,255,0.95)"
              />
              <Circle cx="18" cy="6" r="1.5" fill="rgba(255,255,255,0.8)" />
              <Circle cx="6" cy="17" r="1" fill="rgba(255,255,255,0.65)" />
            </Svg>
          </LinearGradient>
        </PulseScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(52,211,153,0.35)',
  },
  ring: {
    position: 'absolute',
    overflow: 'hidden',
  },
  coreWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
