import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space, type as typeScale } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  accent?: string;
}

export default function SectionHeader({ title, subtitle, accent = colors.partner.accent }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    marginBottom: space[3],
  },
  accent: {
    width: 3,
    minHeight: 28,
    borderRadius: 2,
    marginTop: 2,
  },
  textWrap: { flex: 1 },
  title: {
    ...typeScale.heading,
    color: colors.text.primary,
  },
  sub: {
    ...typeScale.bodySm,
    color: colors.text.secondary,
    marginTop: space[1],
  },
});
