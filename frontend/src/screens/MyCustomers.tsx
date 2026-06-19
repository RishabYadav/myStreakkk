import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, space, type as typeScale } from '../theme';
import { Customer } from '../types';
import ScorePuck from '../components/ScorePuck';
import PressableScale from '../components/ui/PressableScale';
import { Skeleton } from '../components/ui/Skeleton';
import { FadeSlideIn, LiveDot } from '../components/ui/motion';
import PartnerScreenHeader from '../components/partner/PartnerScreenHeader';

interface Props {
  customers: Customer[];
  topOpportunityId?: string | null;
  loading?: boolean;
  onOpenCustomer: (id: string) => void;
  onBack: () => void;
}

function dependentsLabel(customer: Customer): string | null {
  const line = customer.why.find((w) => /dependent/i.test(w));
  if (!line) return null;
  const match = line.match(/\b(two|\d+)\s+dependents?/i);
  if (!match) return null;
  const count = match[1].toLowerCase() === 'two' ? '2' : match[1];
  return `${count} dependents`;
}

function getAiPickBullets(customer: Customer): string[] {
  const bullets: string[] = [];
  if (customer.renewsInDays > 0) {
    bullets.push(`Renewal due in ${customer.renewsInDays} days`);
  }
  if (customer.weak_spots.length > 0) {
    bullets.push(`Missing ${customer.weak_spots[0]} protection`);
  }
  const deps = dependentsLabel(customer);
  if (deps) bullets.push(deps);
  if (customer.why.some((w) => /conversion/i.test(w)) || customer.opportunity_score >= 70) {
    bullets.push('High conversion probability');
  }
  return bullets.slice(0, 4);
}

function formatGapSummary(summary: string) {
  return summary.replace(/\s·\s/g, ' • ');
}

function CustomerListSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardInner}>
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="55%" height={17} />
              <Skeleton width="85%" height={14} />
              <Skeleton width="70%" height={12} />
            </View>
            <Skeleton width={48} height={48} circle />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function MyCustomers({ customers, topOpportunityId, loading, onOpenCustomer, onBack }: Props) {
  const sorted = [...customers].sort((a, b) => b.opportunity_score - a.opportunity_score);
  // Use API-provided top opportunity, or fall back to first in sorted list
  const topId = topOpportunityId ?? sorted[0]?.customer_id ?? null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <PartnerScreenHeader
        onBack={onBack}
        kicker="Portfolio"
        title="My Customers"
        subtitle="Ranked by opportunity score — highest conversion priority first."
      >
        <View style={styles.headerMeta}>
          <LiveDot color="#6EE7B7" size={6} />
          <Text style={styles.headerMetaText}>{sorted.length} clients · live ranking</Text>
        </View>
      </PartnerScreenHeader>

      {loading ? (
        <CustomerListSkeleton />
      ) : (
      <View style={styles.list}>
        {sorted.map((c, i) => {
          const isAiPick = c.customer_id === topId;
          if (isAiPick) {
            return (
              <FadeSlideIn key={c.customer_id} index={i}>
                <PressableScale
                  onPress={() => onOpenCustomer(c.customer_id)}
                  style={styles.cardAiPick}
                  scaleTo={0.985}
                >
                  <View style={styles.aiPickBadge}>
                    <Feather name="zap" size={12} color="#EA580C" />
                    <Text style={styles.aiPickBadgeText}>AI picked this customer</Text>
                  </View>

                  <View style={styles.aiPickHeader}>
                    <View style={styles.aiPickHeadCopy}>
                      <Text style={styles.aiPickName}>{c.name}</Text>
                      <Text style={styles.aiPickSub}>{formatGapSummary(c.gapSummary)}</Text>
                    </View>
                    <View style={styles.aiPickScoreRing}>
                      <Text style={styles.aiPickScoreNum}>{c.opportunity_score}</Text>
                    </View>
                  </View>

                  <View style={styles.aiPickList}>
                    {getAiPickBullets(c).map((item) => (
                      <View key={item} style={styles.aiPickRow}>
                        <Feather name="check" size={14} color="#1C1C1E" />
                        <Text style={styles.aiPickBullet}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </PressableScale>
              </FadeSlideIn>
            );
          }

          return (
            <FadeSlideIn key={c.customer_id} index={i}>
              <PressableScale
                onPress={() => onOpenCustomer(c.customer_id)}
                style={styles.card}
                scaleTo={0.985}
              >
                <View style={styles.cardInner}>
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.gap} numberOfLines={2}>
                      {c.gapSummary}
                    </Text>
                    <Text style={styles.metrics}>
                      <Text style={styles.metricLabel}>Opportunity </Text>
                      <Text style={styles.metricValue}>{c.opportunity_score}</Text>
                      <Text style={styles.metricSep}> · </Text>
                      <Text style={styles.metricLabel}>Protection </Text>
                      <Text style={styles.metricValue}>{c.protection_intelligence_score}</Text>
                    </Text>
                  </View>

                  <View style={styles.trailing}>
                    <ScorePuck score={c.protection_intelligence_score} size={50} showLabel />
                    <Feather name="chevron-right" size={16} color="#C7C7CC" style={styles.chevron} />
                  </View>
                </View>
              </PressableScale>
            </FadeSlideIn>
          );
        })}
      </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.canvas },
  content: { paddingBottom: space[11] },
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
  list: {
    paddingHorizontal: space[4],
    paddingTop: space[3],
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D1D6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardAiPick: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    padding: 16,
    gap: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  aiPickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  aiPickBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#C2410C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  aiPickHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiPickHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  aiPickName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 25,
    color: '#1C1C1E',
    letterSpacing: -0.35,
  },
  aiPickSub: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: '#636366',
  },
  aiPickScoreRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  aiPickScoreNum: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#EA580C',
    fontVariant: ['tabular-nums'],
  },
  aiPickList: {
    gap: 10,
    paddingTop: 2,
  },
  aiPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiPickBullet: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
    color: '#1C1C1E',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 72,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 17,
    lineHeight: 22,
    color: '#1C1C1E',
    letterSpacing: -0.25,
  },
  gap: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: '#636366',
  },
  metrics: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  metricLabel: {
    fontFamily: fonts.bodyBold,
    color: '#1C1C1E',
  },
  metricValue: {
    fontFamily: fonts.heading,
    fontVariant: ['tabular-nums'],
    color: '#1C1C1E',
  },
  metricSep: {
    fontFamily: fonts.body,
    color: '#C7C7CC',
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 2,
  },
  chevron: {
    marginTop: 2,
  },
});
