import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Share, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fonts, radius, shadows, space } from '../theme';
import { customerTheme } from '../theme/customerTheme';
import { Customer } from '../types';
import PressableScale from '../components/ui/PressableScale';
import { FadeSlideIn, LiveDot, PulseScale } from '../components/ui/motion';

interface Props {
  customer: Customer;
}

function scoreTier(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) return { label: 'Strong', color: customerTheme.accentDark, bg: customerTheme.accentSoft };
  if (score >= 50) return { label: 'Fair', color: '#1D4ED8', bg: '#DBEAFE' };
  return { label: 'Needs attention', color: '#1E40AF', bg: '#EFF6FF' };
}

export default function CustomerProfile({ customer }: Props) {
  const firstName = customer.name.split(' ')[0];
  const tier = useMemo(() => scoreTier(customer.protection_intelligence_score), [customer.protection_intelligence_score]);
  const coveredCount = customer.coverage.filter((c) => c.covered).length;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${customer.name}'s protection score: ${customer.protection_intelligence_score}/100. Review coverage on Cadence.`,
      });
    } catch {
      /* cancelled */
    }
  };

  const handleCallSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('tel:+91999999999');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FadeSlideIn index={0}>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.actionRow}>
          <PressableScale onPress={handleShare} style={styles.actionBtn} haptic>
            <Feather name="share-2" size={16} color={customerTheme.accent} />
            <Text style={styles.actionBtnText}>Share</Text>
          </PressableScale>
          <PressableScale onPress={handleCallSupport} style={styles.actionBtnPrimary} haptic>
            <Feather name="phone" size={16} color="#FFF" />
            <Text style={styles.actionBtnPrimaryText}>Call Support</Text>
          </PressableScale>
        </View>
      </FadeSlideIn>

      <FadeSlideIn index={1}>
        <View style={[styles.identityCard, shadows.card]}>
          <PulseScale min={1} max={1.02} duration={1800}>
            <LinearGradient colors={customer.avatarColors} style={styles.avatar}>
              <Text style={styles.avatarText}>{customer.initials}</Text>
            </LinearGradient>
          </PulseScale>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.memberMeta}>Cadence secure member</Text>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{customer.protection_intelligence_score}</Text>
            <View style={styles.scoreMeta}>
              <Text style={styles.scoreCaption}>Protection score</Text>
              <View style={[styles.tierPill, { backgroundColor: tier.bg }]}>
                <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.scoreTrack}>
            <View
              style={[
                styles.scoreFill,
                { width: `${Math.min(customer.protection_intelligence_score, 100)}%` },
              ]}
            />
          </View>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{customer.renewsInDays}d</Text>
              <Text style={styles.quickStatLabel}>Renewal</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: customerTheme.accent }]}>{coveredCount}</Text>
              <Text style={styles.quickStatLabel}>Active policies</Text>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      <FadeSlideIn index={2}>
        <View style={[styles.advisorCard, shadows.card]}>
          <View style={styles.advisorIcon}>
            <Feather name="headphones" size={18} color={customerTheme.accent} />
          </View>
          <View style={styles.advisorCopy}>
            <Text style={styles.advisorTitle}>Need help?</Text>
            <Text style={styles.advisorSub}>Your advisor Rahul is available for coverage questions.</Text>
          </View>
          <PressableScale onPress={handleCallSupport} style={styles.advisorBtn} haptic>
            <Text style={styles.advisorBtnText}>Call</Text>
          </PressableScale>
        </View>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: customerTheme.canvas },
  content: { paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: 120 },

  pageTitle: {
    fontFamily: fonts.headingExtra,
    fontSize: 28,
    letterSpacing: -0.6,
    color: customerTheme.textPrimary,
    marginBottom: space[3],
  },
  actionRow: { flexDirection: 'row', gap: space[2], marginBottom: space[4] },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: customerTheme.card,
    borderRadius: radius.md,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: customerTheme.accentBorder,
  },
  actionBtnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: customerTheme.accent },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: customerTheme.accent,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  actionBtnPrimaryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: '#FFF' },

  identityCard: {
    backgroundColor: customerTheme.card,
    borderRadius: radius.xl,
    padding: space[5],
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: customerTheme.accentBorder,
    marginBottom: space[3],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[3],
  },
  avatarText: { fontFamily: fonts.headingExtra, fontSize: 22, color: '#FFF' },
  name: {
    fontFamily: fonts.headingExtra,
    fontSize: 20,
    color: customerTheme.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  memberMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: customerTheme.textMuted,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginTop: space[5],
    marginBottom: space[3],
    alignSelf: 'stretch',
    paddingHorizontal: space[2],
  },
  scoreNumber: {
    fontFamily: fonts.headingExtra,
    fontSize: 44,
    color: customerTheme.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  scoreMeta: { flex: 1, gap: 6 },
  scoreCaption: { fontFamily: fonts.body, fontSize: 13, color: customerTheme.textMuted },
  tierPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  tierText: { fontFamily: fonts.bodyBold, fontSize: 11 },
  scoreTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: customerTheme.progressTrack,
    overflow: 'hidden',
    marginBottom: space[4],
  },
  scoreFill: {
    height: '100%',
    backgroundColor: customerTheme.progressFill,
    borderRadius: 3,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: customerTheme.accentSoft,
    borderRadius: radius.md,
    paddingVertical: space[3],
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: {
    fontFamily: fonts.headingExtra,
    fontSize: 18,
    color: customerTheme.textPrimary,
    letterSpacing: -0.3,
  },
  quickStatLabel: { fontFamily: fonts.body, fontSize: 11, color: customerTheme.textMuted, marginTop: 2 },
  quickStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: customerTheme.accentBorder,
  },

  advisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: customerTheme.card,
    borderRadius: radius.lg,
    padding: space[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: customerTheme.accentBorder,
  },
  advisorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: customerTheme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorCopy: { flex: 1 },
  advisorTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: customerTheme.textPrimary },
  advisorSub: { fontFamily: fonts.body, fontSize: 12, color: customerTheme.textMuted, marginTop: 2, lineHeight: 17 },
  advisorBtn: {
    backgroundColor: customerTheme.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: customerTheme.accentBorder,
  },
  advisorBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: customerTheme.accent },
});
