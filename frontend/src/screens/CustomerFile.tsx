import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../theme';
import { Customer } from '../types';
import ScoreMeter from '../components/ScoreMeter';
import CoverageSourceTag from '../components/CoverageSourceTag';
import BackButton from '../components/ui/BackButton';
import PressableScale from '../components/ui/PressableScale';
import SectionHeader from '../components/ui/SectionHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { FadeSlideIn, FloatView, PulseScale } from '../components/ui/motion';
import ScoreBreakdownAccordion from '../components/customer/ScoreBreakdownAccordion';
import { CADENCE_AI } from '../mockData';

interface LessonItem {
  priority: boolean;
  icon: string;
  title: string;
  body: string;
}

interface Props {
  customer: Customer;
  hasBooked: boolean;
  hasEnriched: boolean;
  onBack: () => void;
  onOpenQuestionnaire: () => void;
  talkingPoints?: string[];
  lessonRecommendations?: LessonItem[];
  loading?: boolean;
}

function CustomerFileSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} />
        <Skeleton width={140} height={20} />
        <View style={styles.topSpacer} />
      </View>
      <View style={{ marginHorizontal: space[4], borderRadius: radius.xl, overflow: 'hidden', marginBottom: space[4] }}>
        <Skeleton height={220} style={{ borderRadius: radius.xl }} />
      </View>
      <View style={{ marginHorizontal: space[4], gap: space[3] }}>
        <Skeleton height={160} style={{ borderRadius: radius.lg }} />
        <Skeleton height={80} style={{ borderRadius: radius.lg }} />
        <Skeleton height={100} style={{ borderRadius: radius.lg }} />
        <View style={{ gap: space[2] }}>
          <Skeleton height={64} style={{ borderRadius: radius.md }} />
          <Skeleton height={64} style={{ borderRadius: radius.md }} />
          <Skeleton height={64} style={{ borderRadius: radius.md }} />
          <Skeleton height={64} style={{ borderRadius: radius.md }} />
        </View>
        <Skeleton height={120} style={{ borderRadius: radius.lg }} />
        <Skeleton height={90} style={{ borderRadius: radius.lg }} />
      </View>
    </ScrollView>
  );
}

export default function CustomerFile({
  customer,
  hasBooked,
  hasEnriched,
  onBack,
  onOpenQuestionnaire,
  talkingPoints,
  lessonRecommendations,
  loading,
}: Props) {
  const insets = useSafeAreaInsets();
  const score = customer.protection_intelligence_score;
  const firstName = customer.name.split(' ')[0];

  if (loading) {
    return <CustomerFileSkeleton onBack={onBack} />;
  }

  // Use API-provided data or fall back to mock
  const lessons = lessonRecommendations ?? CADENCE_AI.lesson_recommendations;
  const talks = talkingPoints ?? CADENCE_AI.talking_points;

  const deltaText = useMemo(() => {
    if (score >= 84) return 'Excellent protection profile achieved!';
    if (score >= 75) return 'Term coverage gaps hold you back';
    return 'Health & term gaps hold you back';
  }, [score]);

  const breakdown = customer.score_breakdown;

  const scoreSubtitle = useMemo(() => {
    const asOf = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return (
      <>
        is {firstName}'s protection score as of{' '}
        <Text style={styles.scoreDate}>{asOf}</Text>
      </>
    );
  }, [firstName]);

  const coverage = customer.coverage.map((row) => {
    if (row.id === 'health' && hasBooked) {
      return { ...row, covered: true, source: 'sold_by_agent' as const };
    }
    if (row.id === 'term' && hasEnriched) {
      return { ...row, covered: true, source: 'added_by_agent' as const };
    }
    return row;
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.topBar, { paddingTop: insets.top + space[1] }]}>
        <BackButton onPress={onBack} />
        <Text style={styles.topTitle} numberOfLines={1}>
          {customer.name}
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <FadeSlideIn index={0}>
      <View style={[styles.scoreCard, shadows.cardLifted]}>
        <View style={styles.scoreCardTop}>
          <Text style={styles.scoreEyebrow}>PROTECTION SCORE</Text>
          <Text style={styles.scoreGreeting}>{firstName}'s profile</Text>
        </View>
        <ScoreMeter
          score={score}
          subtitle={scoreSubtitle}
          scoreColor={colors.heroEnd}
        />
        <View style={styles.deltaBadge}>
          <View style={styles.deltaIcon}>
            <Text style={styles.deltaIconText}>!</Text>
          </View>
          <Text style={styles.deltaText}>{deltaText}</Text>
        </View>
        <Text style={styles.seeded}>
          Built from what PBPartners already holds for {customer.name}
        </Text>
      </View>
      </FadeSlideIn>

      <FadeSlideIn index={1}>
      <View style={styles.breakdownWrap}>
        <ScoreBreakdownAccordion
          rows={breakdown}
          getScore={(key) => breakdown.find((r) => r.key === key)?.score ?? 0}
          headerTitle="View score breakdown"
          sectionLabel="Score breakdown"
          accentColor={colors.heroEnd}
          fillColor={colors.heroEnd}
          trackColor="#F1F5F9"
        />
      </View>
      </FadeSlideIn>

      {hasEnriched ? (
        <FadeSlideIn index={2}>
        <View style={[styles.enrichedDone, shadows.card]}>
          <PulseScale min={1} max={1.08} duration={1200}>
            <Text style={styles.enrichedEmoji}>✅</Text>
          </PulseScale>
          <View>
            <Text style={styles.enrichedTitle}>Coverage Enriched!</Text>
            <Text style={styles.enrichedSub}>Term Life coverage verified and logged.</Text>
          </View>
        </View>
        </FadeSlideIn>
      ) : (
        <FadeSlideIn index={2}>
        <PressableScale
          onPress={onOpenQuestionnaire}
          style={[styles.enrichCard, shadows.card]}
        >
          <View style={styles.enrichLeft}>
            <FloatView distance={2} duration={2200}>
              <Text style={styles.enrichEmoji}>📋</Text>
            </FloatView>
            <View style={{ flex: 1 }}>
              <Text style={styles.enrichTitle}>Add cover {firstName} holds elsewhere</Text>
              <Text style={styles.enrichSub}>
                Ask {firstName} and log any policy bought outside PB to complete her score.
              </Text>
            </View>
          </View>
          <PulseScale min={1} max={1.06} duration={1300}>
            <View style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add</Text>
            </View>
          </PulseScale>
        </PressableScale>
        </FadeSlideIn>
      )}

      <FadeSlideIn index={3}>
      <View style={[styles.opportunityCard, shadows.card]}>
        <SectionHeader title="Why this is your opportunity" accent={colors.accent} />
        <Text style={styles.oppBody}>{customer.whyOpportunity}</Text>
      </View>
      </FadeSlideIn>

      <FadeSlideIn index={4}>
      <SectionHeader title={`${firstName}'s coverage`} accent={colors.mint} />
      {coverage.map((row, i) => (
        <View key={row.id} style={[styles.coverageRow, shadows.card]}>
          <View style={styles.coverageLeft}>
            <FloatView distance={2} duration={2400} delay={i * 60}>
              <View style={styles.coverageIconWrap}>
                <Text style={styles.coverageIcon}>{row.icon}</Text>
              </View>
            </FloatView>
            <View>
              <View style={styles.coverageNameRow}>
                <Text style={styles.coverageName}>{row.name}</Text>
                {row.covered && row.source ? <CoverageSourceTag source={row.source} /> : null}
              </View>
            </View>
          </View>
          <View style={[styles.statusPill, row.covered && styles.statusCovered]}>
            <Text style={[styles.coverageStatus, row.covered && styles.coveredText]}>
              {row.covered ? '✓ Covered' : 'Not covered'}
            </Text>
          </View>
        </View>
      ))}
      </FadeSlideIn>

      <FadeSlideIn index={5}>
      <SectionHeader title="Talking points & lessons" subtitle="Use these in your conversation" accent={colors.accent} />
      {lessons.map((lesson, i) => (
        <View key={i} style={[styles.lessonCard, shadows.card, lesson.priority && styles.lessonPriority]}>
          {lesson.priority && <Text style={styles.priority}>PRIORITY</Text>}
          <FloatView distance={2} duration={2200} delay={i * 80}>
            <Text style={styles.lessonIcon}>{lesson.icon}</Text>
          </FloatView>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonBody}>{lesson.body}</Text>
        </View>
      ))}

      {talks.map((tp, i) => (
        <View key={`tp-${i}`} style={styles.talkCard}>
          <Text style={styles.talkBullet}>💬</Text>
          <Text style={styles.talkText}>{tp}</Text>
        </View>
      ))}
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.canvas },
  content: { paddingBottom: space[11] },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingTop: space[1],
    paddingBottom: space[3],
    gap: space[3],
  },
  topSpacer: { width: touch.min },
  topTitle: {
    ...typeScale.heading,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  scoreCard: {
    marginHorizontal: space[4],
    borderRadius: radius.xl,
    paddingTop: space[5],
    paddingBottom: space[5],
    paddingHorizontal: space[3],
    alignItems: 'center',
    marginBottom: space[4],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  scoreCardTop: {
    alignSelf: 'stretch',
    paddingHorizontal: space[2],
    marginBottom: space[1],
  },
  scoreEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 1.2,
  },
  scoreGreeting: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.text.primary,
    marginTop: 2,
  },
  scoreDate: {
    fontFamily: fonts.bodySemi,
    color: colors.text.secondary,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: space[2],
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignSelf: 'stretch',
    marginHorizontal: space[2],
    zIndex: 2,
  },
  deltaIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.heroEnd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaIconText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
    marginTop: -1,
  },
  deltaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.heroEnd,
    flex: 1,
    lineHeight: 18,
  },
  seeded: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  breakdownWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  enrichCard: {
    marginHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.mint,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F0FDF9',
  },
  enrichLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 8 },
  enrichEmoji: { fontSize: 28 },
  enrichTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.navy },
  enrichSub: { fontFamily: fonts.body, fontSize: 12, color: colors.body, marginTop: 4, lineHeight: 17 },
  addBtn: {
    backgroundColor: colors.mint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 64,
    alignItems: 'center',
  },
  addBtnText: { fontFamily: fonts.heading, fontSize: 14, color: '#FFF' },
  enrichedDone: {
    marginHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.mint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  enrichedEmoji: { fontSize: 32 },
  enrichedTitle: { fontFamily: fonts.heading, fontSize: 14, color: '#063d2c' },
  enrichedSub: { fontFamily: fonts.body, fontSize: 12, color: colors.body, marginTop: 4 },
  opportunityCard: {
    marginHorizontal: space[4],
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: space[4],
    marginBottom: space[4],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  oppBody: { ...typeScale.bodySm, color: colors.text.secondary, lineHeight: 22 },
  coverageRow: {
    marginHorizontal: space[4],
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    padding: space[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  coverageLeft: { flexDirection: 'row', alignItems: 'center', gap: space[3], flex: 1 },
  coverageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverageIcon: { fontSize: 22 },
  coverageNameRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap' },
  coverageName: { fontFamily: fonts.bodySemi, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary },
  statusPill: {
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    backgroundColor: colors.surface.canvas,
  },
  statusCovered: { backgroundColor: colors.status.successSoft },
  coverageStatus: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.text.secondary },
  coveredText: { color: colors.status.success },
  lessonCard: {
    marginHorizontal: space[4],
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    padding: space[4],
    marginBottom: space[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  lessonPriority: { borderColor: colors.partner.accent, borderWidth: 1.5 },
  priority: {
    ...typeScale.label,
    color: colors.partner.accent,
    marginBottom: space[2],
  },
  lessonIcon: { fontSize: 24, marginBottom: space[2] },
  lessonTitle: { fontFamily: fonts.heading, fontSize: typeScale.body.fontSize, color: colors.text.primary, marginBottom: space[2] },
  lessonBody: { ...typeScale.bodySm, color: colors.text.secondary, lineHeight: 20 },
  talkCard: {
    marginHorizontal: space[4],
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    padding: space[4],
    marginBottom: space[2],
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  talkBullet: { fontSize: 16 },
  talkText: { ...typeScale.bodySm, color: colors.text.secondary, flex: 1 },
});
