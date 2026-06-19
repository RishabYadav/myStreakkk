import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, space, type as typeScale } from '../theme';
import { AgentState } from '../types';
import { getInitials } from '../utils';
import Card from '../components/ui/Card';
import {
  BreatheView,
  FadeSlideIn,
  FloatView,
  LiveDot,
  PulseScale,
  ShimmerBand,
} from '../components/ui/motion';
import CoinIcon from '../components/ui/CoinIcon';

interface Props {
  agent: AgentState;
}

function InfoRow({
  icon,
  label,
  value,
  index,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  index: number;
}) {
  return (
    <FadeSlideIn index={index + 1}>
      <View style={styles.infoRow}>
        <PulseScale min={1} max={1.06} duration={1800 + index * 200}>
          <View style={styles.infoIconWrap}>
            <Feather name={icon} size={16} color={colors.partner.accent} />
          </View>
        </PulseScale>
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </FadeSlideIn>
  );
}

export default function Profile({ agent }: Props) {
  const initials = getInitials(agent.name);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[...colors.partner.hero]} style={styles.hero}>
        <BreatheView style={styles.heroGlow} duration={3200} min={0.25} max={0.85} />
        <ShimmerBand bandWidth={72} duration={3200} style={styles.heroShimmer} />
        <View style={styles.heroTop}>
          <Text style={styles.heroTitle}>My Profile</Text>
          <PulseScale min={1} max={1.04} duration={1400}>
            <View style={styles.activeChip}>
              <LiveDot color={colors.status.success} size={8} />
              <Text style={styles.activeText}>Active POSP</Text>
            </View>
          </PulseScale>
        </View>
        <Text style={styles.heroSub}>
          PBPartners certified POSP partner portal. Your records, compliance, and licensing details.
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <FadeSlideIn index={0}>
          <Card style={styles.card}>
            <View style={styles.profileRow}>
              <PulseScale min={1} max={1.05} duration={1600}>
                <LinearGradient colors={['#F8D26A', '#E89B17']} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              </PulseScale>
              <View>
                <Text style={styles.name}>{agent.name}</Text>
                <Text style={styles.pospId}>Partner POSP ID: PB-940382</Text>
              </View>
            </View>
            <View style={styles.infoList}>
              <InfoRow icon="mail" label="Email registry" value={agent.email} index={0} />
              <InfoRow icon="shield" label="Licensing approval" value="IRDAI Certified (Life & Health)" index={1} />
              <InfoRow icon="map-pin" label="Assigned division" value="Mumbai South Registry (Zone-3)" index={2} />
            </View>
          </Card>
        </FadeSlideIn>

        <FadeSlideIn index={1}>
          <Card style={styles.card}>
            <Text style={styles.ledgerTitle}>Cadence ledger metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Active streak</Text>
                <View style={styles.streakMetricRow}>
                  <FloatView distance={3} duration={1800}>
                    <Text style={styles.streakFlame}>🔥</Text>
                  </FloatView>
                  <PulseScale min={1} max={1.06} duration={1200}>
                    <Text style={styles.metricValue}>{agent.streak_day} days</Text>
                  </PulseScale>
                </View>
              </View>
              <View style={[styles.metricCell, styles.metricCellCoins]}>
                <Text style={styles.metricLabel}>Coins balance</Text>
                <View style={styles.metricCoinRow}>
                  <CoinIcon size="sm" float />
                  <PulseScale min={1} max={1.05} duration={1400}>
                    <Text style={[styles.metricValue, styles.coinValue]}>{agent.coins}</Text>
                  </PulseScale>
                </View>
              </View>
            </View>
          </Card>
        </FadeSlideIn>

        <FadeSlideIn index={2}>
          <Text style={styles.footer}>
            Regulated under IRDAI digital agency guidelines. Activity metrics undergo tamper-proof auditing.
          </Text>
        </FadeSlideIn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.canvas },
  content: { paddingBottom: space[11] },
  hero: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[6],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroShimmer: { opacity: 0.3 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[2] },
  heroTitle: { ...typeScale.title, color: colors.text.inverse },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: 'rgba(5,150,105,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.35)',
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.pill,
  },
  activeText: { ...typeScale.label, color: '#6EE7B7', fontSize: 10 },
  heroSub: { ...typeScale.bodySm, color: colors.text.inverseMuted },
  body: { padding: space[4], gap: space[4] },
  card: { marginBottom: 0 },
  profileRow: {
    flexDirection: 'row',
    gap: space[3],
    paddingBottom: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    marginBottom: space[4],
  },
  avatar: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.headingExtra, fontSize: 14, color: '#3a2a08' },
  name: { fontFamily: fonts.headingExtra, fontSize: typeScale.body.fontSize, color: colors.text.primary },
  pospId: { ...typeScale.caption, color: colors.partner.accent, marginTop: space[1], textTransform: 'uppercase' },
  infoList: { gap: space[4] },
  infoRow: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.partner.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { ...typeScale.caption, color: colors.text.tertiary },
  infoValue: { fontFamily: fonts.bodySemi, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary, marginTop: 2 },
  ledgerTitle: { ...typeScale.label, color: colors.text.tertiary, marginBottom: space[3] },
  metricsGrid: { flexDirection: 'row', gap: space[3] },
  metricCell: {
    flex: 1,
    backgroundColor: colors.surface.canvasTint,
    borderRadius: radius.md,
    padding: space[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minHeight: 72,
  },
  metricCellCoins: { backgroundColor: colors.partner.accentSoft, borderColor: '#BFDBFE' },
  metricLabel: { ...typeScale.label, color: colors.text.tertiary, marginBottom: space[1] },
  streakMetricRow: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  streakFlame: { fontSize: 18 },
  metricCoinRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  metricValue: { fontFamily: fonts.headingExtra, fontSize: typeScale.title.fontSize - 4, color: colors.text.primary },
  coinValue: { color: colors.partner.accent },
  footer: {
    ...typeScale.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: space[2],
  },
});
