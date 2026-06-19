import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, radius, spacing } from '../theme';
import PressableScale from '../components/ui/PressableScale';
import CoinBadge from '../components/ui/CoinBadge';

interface Props {
  monthlyMasterEarned: boolean;
  coins?: number;
}

const BADGES = [
  { id: 'd7', name: 'Fast Starter', day: 'Day 7', emoji: '⚡', earned: true },
  { id: 'd14', name: 'Weekly Warrior', day: 'Day 14', emoji: '🏆', earned: true },
  { id: 'd21', name: 'Streak Sentinel', day: 'Day 21', emoji: '🛡️', earned: true },
  { id: 'd30', name: 'Monthly Master', day: 'Day 30', emoji: '👑', earnedKey: 'monthly' as const },
];

const LOCKED = [
  { name: 'Shareable Content', emoji: '📣', unlock: 'D60' },
  { name: 'Streak Freeze', emoji: '❄️', unlock: 'D60' },
  { name: 'Streak Restore', emoji: '⏳', unlock: 'D60' },
];

export default function Rewards({ monthlyMasterEarned, coins = 0 }: Props) {
  const { width } = useWindowDimensions();
  const horizontalPad = spacing.md * 2;
  const gap = 12;
  const cardWidth = (width - horizontalPad - gap) / 2;

  const badges = BADGES.map((b) =>
    b.earnedKey === 'monthly' ? { ...b, earned: monthlyMasterEarned } : b
  );
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.heroStart, '#243B8F', colors.heroEnd]}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Your rewards</Text>
        <Text style={styles.heroSub}>
          Badges, shareable content, and streak safeguards as your cadence grows.
        </Text>

        <View style={styles.heroCoinRow}>
          <CoinBadge amount={coins} size="lg" />
        </View>

        <View style={styles.heroChip}>
          <Text style={styles.heroChipText}>
            {earnedCount} badges earned · Next unlock at Day 60
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 BADGES EARNED</Text>
        <View style={styles.grid}>
          {badges.map((b) => (
            <View key={b.id} style={[styles.gridCell, { width: cardWidth }]}>
              <PressableScale
                style={[
                  styles.badgeCard,
                  shadows.card,
                  !b.earned && styles.badgeLocked,
                ]}
                onPress={() =>
                  Haptics.impactAsync(
                    b.earned
                      ? Haptics.ImpactFeedbackStyle.Medium
                      : Haptics.ImpactFeedbackStyle.Light
                  )
                }
              >
                {b.earned ? (
                  <View style={styles.earnedCheck}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.lockChip}>
                    <Text style={styles.lockText}>🔒</Text>
                  </View>
                )}
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {b.name}
                </Text>
                <Text style={styles.badgeDay}>{b.day}</Text>
              </PressableScale>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 LOCKED REWARDS</Text>
        {LOCKED.map((item) => (
          <View key={item.name} style={[styles.lockedCard, shadows.card]}>
            <View style={styles.lockedLeft}>
              <View style={styles.lockedIconWrap}>
                <Text style={styles.lockedEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.lockedName} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
            <View style={styles.unlockChip}>
              <Text style={styles.unlockText}>🔒 {item.unlock}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: 110 },
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: 28,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: { fontFamily: fonts.headingExtra, fontSize: 28, color: '#FFF' },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 10,
    lineHeight: 21,
  },
  heroCoinRow: {
    marginTop: 18,
    alignItems: 'flex-start',
  },
  heroChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroChipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: '#FFF' },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: {
    fontFamily: fonts.headingExtra,
    fontSize: 11,
    color: colors.body,
    letterSpacing: 1,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridCell: {
    // width set dynamically
  },
  badgeCard: {
    width: '100%',
    minHeight: 140,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.canvas,
  },
  badgeLocked: { opacity: 0.55 },
  earnedCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  lockChip: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  lockText: { fontSize: 16 },
  badgeEmoji: { fontSize: 34, marginBottom: 8 },
  badgeName: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.navy,
    textAlign: 'center',
    lineHeight: 18,
  },
  badgeDay: { fontFamily: fonts.body, fontSize: 11, color: colors.body, marginTop: 4 },
  lockedCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(115,110,140,0.3)',
  },
  lockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  lockedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lockedEmoji: { fontSize: 22 },
  lockedName: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.body,
    flex: 1,
  },
  unlockChip: {
    backgroundColor: 'rgba(115,110,140,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  unlockText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.body },
});
