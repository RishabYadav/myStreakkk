import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, space, type as typeScale, touch } from '../../theme';

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'partner' | 'customer';
}

export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  variant = 'partner',
}: Props<T>) {
  const activeColor = variant === 'customer' ? colors.customer.accent : colors.partner.accent;

  return (
    <View style={[styles.wrap, variant === 'customer' && styles.wrapCustomer]}>
      {segments.map((seg) => {
        const active = value === seg.value;
        return (
          <Pressable
            key={seg.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(seg.value);
            }}
            style={[styles.btn, active && styles.btnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && { color: activeColor }]}>{seg.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  wrapCustomer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  btn: {
    paddingHorizontal: space[3],
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: radius.sm,
    minWidth: touch.min / 2,
  },
  btnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.label.fontSize,
    color: colors.text.inverseMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});
