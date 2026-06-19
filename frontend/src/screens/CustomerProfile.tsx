import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Share, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fonts, radius, shadows, space } from '../theme';
import { customerTheme } from '../theme/customerTheme';
import { Customer } from '../types';
import PressableScale from '../components/ui/PressableScale';
import {
  AnimatedProgressBar,
  BreatheView,
  FadeSlideIn,
  LiveDot,
} from '../components/ui/motion';

interface Props {
  customer: Customer;
}

const COVERAGE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  motor: 'truck',
  life: 'heart',
  health: 'activity',
  term: 'shield',
};

const ACTION_BTN_HEIGHT = 52;

function scoreTier(score: number) {
  if (score >= 70) {
    return {
      label: 'Strong',
      color: '#059669',
      bg: '#D1FAE5',
      ring: '#10B981',
      glow: 'rgba(16,185,129,0.18)',
      bar: ['#34D399', '#059669'] as const,
    };
  }
  if (score >= 50) {
    return {
      label: 'Fair',
      color: '#B45309',
      bg: '#FEF3C7',
      ring: '#F59E0B',
      glow: 'rgba(245,158,11,0.2)',
      bar: ['#FBBF24', '#F59E0B'] as const,
    };
  }
  return {
    label: 'Needs attention',
    color: '#C2410C',
    bg: '#FFEDD5',
    ring: '#F97316',
    glow: 'rgba(249,115,22,0.2)',
    bar: ['#FB923C', '#EA580C'] as const,
  };
}

export default function CustomerProfile({ customer }: Props) {
  const tier = useMemo(
    () => scoreTier(customer.protection_intelligence_score),
    [customer.protection_intelligence_score],
  );
  const coveredCount = customer.coverage.filter((c) => c.covered).length;
  const renewalUrgent = customer.renewsInDays <= 14;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${customer.name}'s protection score: ${customer.protection_intelligence_score}/100. Review coverage on Cadence.`,
      });
    } catch {
      /* cancelled */
    }
  };

  const handleCallSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('tel:+91999999999');
  };

  const handleCoverageTap = (name: string, covered: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!covered) {
      Linking.openURL('tel:+91999999999');
    }
  };

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={['#BFDBFE', '#DBEAFE', customerTheme.canvas]}
        locations={[0, 0.35, 1]}
        style={styles.heroBg}
        pointerEvents="none"
      />
      <BreatheView
        duration={3200}
        min={0.35}
        max={0.7}
        style={[styles.heroOrb, styles.heroOrbLeft]}
      />
      <BreatheView
        duration={2800}
        min={0.25}
        max={0.55}
        style={[styles.heroOrb, styles.heroOrbRight]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn index={0}>
          <Text style={styles.pageTitle}>Profile</Text>
          <View style={styles.actionRow}>
            <PressableScale onPress={handleShare} style={styles.actionBtn} haptic>
              <View style={styles.actionIconWrap}>
                <Feather name="share-2" size={16} color={customerTheme.accentDark} />
              </View>
              <Text style={styles.actionBtnText}>Share</Text>
            </PressableScale>
            <PressableScale onPress={handleCallSupport} style={styles.actionBtnPrimaryWrap} haptic>
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtnPrimary}
              >
                <Feather name="phone" size={16} color="#FFF" />
                <Text style={styles.actionBtnPrimaryText}>Call Support</Text>
              </LinearGradient>
            </PressableScale>
          </View>
        </FadeSlideIn>

        <FadeSlideIn index={1}>
          <View style={[styles.identityCard, shadows.card]}>
            <LinearGradient colors={['#FFFFFF', '#F8FAFF']} style={StyleSheet.absoluteFill} />

            <View style={styles.profileHeader}>
              <LinearGradient colors={customer.avatarColors} style={styles.avatar}>
                <Text style={styles.avatarText}>{customer.initials}</Text>
              </LinearGradient>
              <View style={styles.profileMeta}>
                <Text style={styles.name} numberOfLines={1}>
                  {customer.name}
                </Text>
                <View style={styles.memberRow}>
                  <LiveDot color="#22C55E" size={6} />
                  <Text style={styles.memberMeta}>Cadence secure member</Text>
                </View>
              </View>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{customer.protection_intelligence_score}</Text>
              <View style={styles.scoreMeta}>
                <Text style={styles.scoreCaption}>Protection score</Text>
                <View style={[styles.tierPill, { backgroundColor: tier.bg }]}>
                  <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                  <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
                </View>
              </View>
            </View>

            <AnimatedProgressBar
              pct={customer.protection_intelligence_score}
              fillColor={tier.ring}
              trackColor="#E2E8F0"
              height={6}
              style={styles.progressBar}
            />

            <View style={styles.coverageRow}>
              {customer.coverage.map((row) => {
                const icon = COVERAGE_ICON[row.id] ?? 'circle';
                return (
                  <PressableScale
                    key={row.id}
                    onPress={() => handleCoverageTap(row.name, row.covered)}
                    style={[
                      styles.coverageChip,
                      row.covered ? styles.coverageChipActive : styles.coverageChipGap,
                    ]}
                    haptic
                  >
                    <Feather
                      name={icon}
                      size={11}
                      color={row.covered ? '#059669' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.coverageLabel,
                        row.covered ? styles.coverageLabelActive : styles.coverageLabelGap,
                      ]}
                    >
                      {row.name}
                    </Text>
                    {row.covered ? (
                      <Feather name="check" size={9} color="#059669" />
                    ) : (
                      <Text style={styles.gapTag}>Gap</Text>
                    )}
                  </PressableScale>
                );
              })}
            </View>

            <View style={styles.quickStats}>
              <PressableScale style={styles.quickStat} haptic onPress={handleCallSupport}>
                <Feather
                  name="clock"
                  size={13}
                  color={renewalUrgent ? '#D97706' : customerTheme.accentDark}
                />
                <Text
                  style={[
                    styles.quickStatValue,
                    renewalUrgent && styles.quickStatValueUrgent,
                  ]}
                >
                  {customer.renewsInDays}d
                </Text>
                <Text style={styles.quickStatLabel}>Renewal</Text>
              </PressableScale>

              <View style={styles.quickStatDivider} />

              <PressableScale style={styles.quickStat} haptic>
                <Feather name="file-text" size={13} color={customerTheme.accentDark} />
                <Text style={[styles.quickStatValue, { color: customerTheme.accentDark }]}>
                  {coveredCount}
                </Text>
                <Text style={styles.quickStatLabel}>Active policies</Text>
              </PressableScale>
            </View>
          </View>
        </FadeSlideIn>

        <FadeSlideIn index={2}>
          <LinearGradient
            colors={['#EFF6FF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.advisorCard, shadows.card]}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.advisorIcon}>
              <Feather name="headphones" size={16} color="#FFF" />
            </LinearGradient>
            <View style={styles.advisorCopy}>
              <Text style={styles.advisorTitle}>Need help?</Text>
              <Text style={styles.advisorSub}>
                Your advisor Rahul is available for coverage questions.
              </Text>
            </View>
            <PressableScale onPress={handleCallSupport} haptic>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.advisorBtn}
              >
                <Feather name="phone" size={12} color="#FFF" />
                <Text style={styles.advisorBtnText}>Call</Text>
              </LinearGradient>
            </PressableScale>
          </LinearGradient>
        </FadeSlideIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: customerTheme.canvas },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  heroOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroOrbLeft: {
    width: 140,
    height: 140,
    top: 40,
    left: -40,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  heroOrbRight: {
    width: 100,
    height: 100,
    top: 120,
    right: -20,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: 120 },

  pageTitle: {
    fontFamily: fonts.headingExtra,
    fontSize: 28,
    letterSpacing: -0.6,
    color: customerTheme.textPrimary,
    marginBottom: space[3],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space[2],
    marginBottom: space[4],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: ACTION_BTN_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: customerTheme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: customerTheme.accentDark },
  actionBtnPrimaryWrap: {
    flex: 1,
    height: ACTION_BTN_HEIGHT,
    borderRadius: radius.lg,
  },
  actionBtnPrimary: {
    flex: 1,
    height: ACTION_BTN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
  },
  actionBtnPrimaryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: '#FFF' },

  identityCard: {
    borderRadius: radius.lg,
    padding: space[4],
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: space[3],
    overflow: 'hidden',
    gap: space[3],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: fonts.headingExtra, fontSize: 18, color: '#FFF' },
  profileMeta: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fonts.headingExtra,
    fontSize: 18,
    color: customerTheme.textPrimary,
    letterSpacing: -0.3,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  memberMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: customerTheme.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  scoreNumber: {
    fontFamily: fonts.headingExtra,
    fontSize: 40,
    color: customerTheme.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  scoreMeta: { flex: 1, gap: 4 },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  tierDot: { width: 5, height: 5, borderRadius: 2.5 },
  tierText: { fontFamily: fonts.bodyBold, fontSize: 11 },
  scoreCaption: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: customerTheme.textMuted,
  },
  progressBar: { borderRadius: 3 },

  coverageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  coverageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  coverageChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  coverageChipGap: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  coverageLabel: { fontFamily: fonts.bodySemi, fontSize: 10 },
  coverageLabelActive: { color: '#065F46' },
  coverageLabelGap: { color: '#64748B' },
  gapTag: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: '#EA580C',
    letterSpacing: 0.3,
  },

  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: customerTheme.accentSoft,
    borderRadius: radius.md,
    paddingVertical: space[2],
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickStat: { flex: 1, alignItems: 'center', gap: 2 },
  quickStatValue: {
    fontFamily: fonts.headingExtra,
    fontSize: 16,
    color: customerTheme.textPrimary,
    letterSpacing: -0.3,
  },
  quickStatValueUrgent: { color: '#D97706' },
  quickStatLabel: { fontFamily: fonts.body, fontSize: 10, color: customerTheme.textMuted },
  quickStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#BFDBFE',
  },

  advisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderRadius: radius.lg,
    padding: space[3],
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  advisorIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorCopy: { flex: 1 },
  advisorTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: customerTheme.textPrimary },
  advisorSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: customerTheme.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  advisorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  advisorBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#FFF' },
});
