import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, shadows, radius, space, type as typeScale } from '../theme';
import { Customer } from '../types';
import ScorePuck from '../components/ScorePuck';
import PressableScale from '../components/ui/PressableScale';
import {
  BreatheView,
  FadeSlideIn,
  FloatView,
  LiveDot,
  PulseScale,
  ShimmerBand,
} from '../components/ui/motion';
import { PARTNER_INTELLIGENCE } from '../mockData';

interface Props {
  customers: Customer[];
  onOpenCustomer: (id: string) => void;
}

export default function MyCustomers({ customers, onOpenCustomer }: Props) {
  const sorted = [...customers].sort((a, b) => b.opportunity_score - a.opportunity_score);
  const topId = PARTNER_INTELLIGENCE.top_opportunity;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[...colors.partner.hero]} style={styles.header}>
        <BreatheView style={styles.headerGlow} duration={3200} min={0.25} max={0.85} />
        <ShimmerBand bandWidth={72} duration={3000} style={styles.headerShimmer} />
        <Text style={styles.kicker}>Portfolio</Text>
        <Text style={styles.title}>My Customers</Text>
        <Text style={styles.sub}>
          Ranked by opportunity score — highest conversion priority first.
        </Text>
        <View style={styles.headerMeta}>
          <LiveDot color="#6EE7B7" size={6} />
          <Text style={styles.headerMetaText}>{sorted.length} clients · live ranking</Text>
        </View>
      </LinearGradient>

      <View style={styles.list}>
        {sorted.map((c, i) => {
          const isAiPick = c.customer_id === topId;
          return (
            <FadeSlideIn key={c.customer_id} index={i}>
              <PressableScale
                onPress={() => onOpenCustomer(c.customer_id)}
                style={[styles.card, shadows.card, isAiPick && styles.cardAi]}
              >
                {isAiPick && (
                  <>
                    <ShimmerBand bandWidth={56} duration={2800} style={styles.cardShimmer} />
                    <BreatheView style={styles.cardAccent} duration={1500} min={0.5} max={1} />
                  </>
                )}
                {isAiPick && (
                  <View style={styles.aiBanner}>
                    <LiveDot color="#F59E0B" size={5} />
                    <PulseScale min={1} max={1.03} duration={1100}>
                      <Text style={styles.aiBannerText}>AI pick · act now</Text>
                    </PulseScale>
                  </View>
                )}
                <View style={styles.cardInner}>
                  <FloatView distance={2} duration={2200} delay={i * 100}>
                    <LinearGradient colors={c.avatarColors} style={styles.avatar}>
                      <Text style={styles.avatarText}>{c.initials}</Text>
                    </LinearGradient>
                  </FloatView>
                  <View style={styles.info}>
                    <Text style={styles.name}>{c.name}</Text>
                    <Text style={styles.gap} numberOfLines={2}>
                      {c.gapSummary}
                    </Text>
                    <View style={styles.scoresRow}>
                      <PulseScale min={1} max={1.04} duration={1400 + i * 100}>
                        <View style={[styles.osPill, isAiPick && styles.osPillAi]}>
                          <Text style={styles.osLabel}>Opportunity {c.opportunity_score}</Text>
                        </View>
                      </PulseScale>
                      <View style={styles.pisPill}>
                        <Text style={styles.pisLabel}>Protection {c.protection_intelligence_score}</Text>
                      </View>
                    </View>
                  </View>
                  <PulseScale min={1} max={isAiPick ? 1.08 : 1.04} duration={isAiPick ? 1200 : 1800}>
                    <ScorePuck score={c.protection_intelligence_score} size={58} showLabel />
                  </PulseScale>
                </View>
              </PressableScale>
            </FadeSlideIn>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.canvas },
  content: { paddingBottom: space[11] },
  header: {
    paddingHorizontal: space[5],
    paddingTop: space[6],
    paddingBottom: space[6],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerShimmer: { opacity: 0.28 },
  kicker: {
    ...typeScale.label,
    color: colors.text.inverseMuted,
    marginBottom: space[2],
  },
  title: { ...typeScale.title, color: colors.text.inverse },
  sub: {
    ...typeScale.bodySm,
    color: colors.text.inverseMuted,
    marginTop: space[2],
    maxWidth: 320,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[3],
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerMetaText: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.caption.fontSize,
    color: colors.text.inverseMuted,
  },
  list: { padding: space[4], gap: space[3] },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAi: {
    backgroundColor: '#FFFBEB',
    borderColor: 'rgba(251,191,36,0.35)',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.status.warning,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  cardShimmer: { opacity: 0.35 },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    backgroundColor: colors.status.warningSoft,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  aiBannerText: {
    ...typeScale.label,
    color: '#92400E',
    textAlign: 'center',
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: space[4], gap: space[3] },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.headingExtra, fontSize: 16, color: colors.text.inverse },
  info: { flex: 1 },
  name: { fontFamily: fonts.headingExtra, fontSize: typeScale.body.fontSize, color: colors.text.primary },
  gap: { ...typeScale.bodySm, color: colors.text.secondary, marginTop: space[1] },
  scoresRow: { flexDirection: 'row', gap: space[2], marginTop: space[2], flexWrap: 'wrap' },
  osPill: {
    backgroundColor: colors.orangeTag,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  osPillAi: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  osLabel: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.orangeTagText },
  pisPill: {
    backgroundColor: colors.surface.canvasTint,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  pisLabel: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.text.secondary },
});
