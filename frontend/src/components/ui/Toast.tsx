import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors, fonts, radius, space, type as typeScale } from '../../theme';

interface Props {
  message: string | null;
  onHide?: () => void;
  bottom?: number;
  variant?: 'dark' | 'green' | 'error';
  duration?: number;
}

export default function Toast({
  message,
  onHide,
  bottom = 96,
  variant = 'dark',
  duration = 3200,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!message) {
      opacity.setValue(0);
      translateY.setValue(16);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(16);

    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onHideRef.current?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        variant === 'green' && styles.toastGreen,
        variant === 'error' && styles.toastError,
        { bottom, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    backgroundColor: colors.text.primary,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastGreen: {
    backgroundColor: colors.customerGreenDark,
  },
  toastError: {
    backgroundColor: colors.status.error,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.inverse,
    textAlign: 'center',
    lineHeight: typeScale.bodySm.lineHeight,
  },
});
