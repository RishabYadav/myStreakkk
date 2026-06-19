import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fonts, radius, space } from '../../theme';
import { customerTheme } from '../../theme/customerTheme';

interface Props {
  expanded: boolean;
  onToggle: () => void;
  remainingCount: number;
  label?: string;
}

export default function AccordionToggle({ expanded, onToggle, remainingCount, label }: Props) {
  if (remainingCount <= 0) return null;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <Text style={styles.text}>
        {expanded ? 'Show less' : label ?? `Show ${remainingCount} more`}
      </Text>
      <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={customerTheme.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
    paddingVertical: space[3],
    marginTop: space[1],
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: customerTheme.accent,
  },
});
