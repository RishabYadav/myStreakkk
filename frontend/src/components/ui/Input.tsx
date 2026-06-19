import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, fonts, radius, space, type as typeScale } from '../../theme';

interface Props extends TextInputProps {
  label: string;
}

export default function Input({ label, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[styles.input, focused && styles.inputFocused, style]}
        placeholderTextColor={colors.text.tertiary}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space[3] },
  label: {
    ...typeScale.label,
    color: colors.text.tertiary,
    marginBottom: space[2],
  },
  input: {
    minHeight: 48,
    backgroundColor: colors.surface.canvas,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontFamily: fonts.body,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.border.focus,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
});
