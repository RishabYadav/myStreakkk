import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fonts, shadows, space } from '../../theme';
import { customerTheme } from '../../theme/customerTheme';
import { ScoreDimension } from '../../types';
import { AnimatedProgressBar } from '../ui/motion';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  rows: ScoreDimension[];
  getScore: (key: string) => number;
  labelMap?: Record<string, string>;
  headerTitle?: string;
  sectionLabel?: string;
  accentColor?: string;
  fillColor?: string;
  trackColor?: string;
}

export default function ScoreBreakdownAccordion({
  rows,
  getScore,
  labelMap = {},
  headerTitle = 'View protection score breakdown',
  sectionLabel = 'My Safety Index Breakdown',
  accentColor = customerTheme.accent,
  fillColor = customerTheme.progressFill,
  trackColor = customerTheme.progressTrack,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((v) => !v);
  };

  return (
    <View style={[styles.card, shadows.card]}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[styles.headerIcon, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}33` }]}>
          <Feather name="bar-chart-2" size={18} color={accentColor} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          {!expanded ? (
            <Text style={styles.headerSub}>{rows.length} factors affecting your score</Text>
          ) : null}
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={accentColor}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>{sectionLabel}</Text>
          {rows.map((row) => {
            const current = getScore(row.key);
            const pct = Math.min((current / row.max) * 100, 100);
            return (
              <View key={row.key} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName}>{labelMap[row.key] ?? row.name}</Text>
                  <Text style={[styles.rowVal, { color: accentColor, backgroundColor: `${accentColor}14` }]}>
                    {current}/{row.max}
                  </Text>
                </View>
                <AnimatedProgressBar pct={pct} fillColor={fillColor} trackColor={trackColor} height={6} />
              </View>
            );
          })}
          <Pressable onPress={toggle} style={styles.showLess} accessibilityRole="button">
            <Text style={[styles.showLessText, { color: accentColor }]}>Show less</Text>
            <Feather name="chevron-up" size={16} color={accentColor} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customerTheme.accentBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[4],
    paddingHorizontal: space[4],
    gap: space[3],
  },
  headerPressed: { opacity: 0.85 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: customerTheme.textPrimary,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: customerTheme.textMuted,
  },
  body: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  sectionLabel: {
    fontFamily: fonts.headingExtra,
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: space[3],
    marginBottom: space[3],
  },
  row: { marginBottom: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowName: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: '#0F172A' },
  rowVal: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  showLess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
    paddingVertical: space[3],
    marginTop: space[1],
  },
  showLessText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
});
