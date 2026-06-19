import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CoverageSource } from '../types';
import { colors, fonts } from '../theme';

const SOURCE_META: Record<
  Exclude<CoverageSource, null>,
  { label: string; bg: string; color: string }
> = {
  pb_held: { label: 'PB held', bg: colors.purpleTag, color: colors.purpleTagText },
  sold_by_agent: { label: 'Sold by you', bg: '#E6F9F3', color: colors.mint },
  added_by_agent: { label: 'Added by agent', bg: colors.orangeTag, color: colors.orangeTagText },
};

export default function CoverageSourceTag({ source }: { source: CoverageSource }) {
  if (!source) return null;
  const meta = SOURCE_META[source];
  return (
    <View style={[styles.tag, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontFamily: fonts.bodySemi, fontSize: 8.5 },
});
