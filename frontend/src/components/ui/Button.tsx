import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadows, space, touch, type as typeScale } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'customer';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const content = loading ? (
    <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.partner.accent : '#FFF'} />
  ) : (
    <Text
      style={[
        styles.label,
        variant === 'secondary' && styles.labelSecondary,
        variant === 'ghost' && styles.labelGhost,
      ]}
    >
      {label}
    </Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          fullWidth && styles.full,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          shadows.button,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        <LinearGradient colors={[colors.partner.accent, colors.heroEnd]} style={styles.gradient}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'customer') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          styles.customer,
          fullWidth && styles.full,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'success' && styles.success,
        fullWidth && styles.full,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
  },
  full: { alignSelf: 'stretch' },
  gradient: {
    minHeight: touch.min,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
    width: '100%',
  },
  primary: {},
  secondary: {
    backgroundColor: colors.surface.canvasTint,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  success: {
    backgroundColor: colors.status.success,
  },
  customer: {
    backgroundColor: colors.customer.accent,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  label: {
    fontFamily: fonts.heading,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.inverse,
  },
  labelSecondary: {
    color: colors.partner.accent,
  },
  labelGhost: {
    color: colors.text.secondary,
    fontFamily: fonts.bodySemi,
  },
});
