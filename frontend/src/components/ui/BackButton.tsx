import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadows, space, touch } from '../../theme';

interface Props {
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
}

export default function BackButton({ onPress, label, style }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Feather name="chevron-left" size={22} color={colors.text.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.min,
    minWidth: touch.min,
    paddingHorizontal: space[3],
    borderRadius: radius.md,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: space[1],
    ...shadows.card,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text.primary,
  },
});
