import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  Linking,
  LayoutAnimation,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../theme';
import { customerTheme } from '../theme/customerTheme';
import { Customer } from '../types';
import ScoreRing from '../components/ScoreRing';
import Toast from '../components/ui/Toast';
import AccordionToggle from '../components/ui/AccordionToggle';
import { AnimatedProgressBar, BreatheView, FadeSlideIn, LiveDot, PulseScale, ShimmerBand } from '../components/ui/motion';
import CustomerAiAssistant from '../components/customer/CustomerAiAssistant';
import ScoreBreakdownAccordion from '../components/customer/ScoreBreakdownAccordion';

const ANJALI_ID = 'C5501';

interface ExternalPolicy {
  id: string;
  insurer: string;
  category: string;
  sumInsured: string;
  expiryDate: string;
}

interface Props {
  customer: Customer;
  hasBooked: boolean;
  hasEnriched: boolean;
  previewMode?: boolean;
  onBack?: () => void;
  fabBottomOffset?: number;
}

function getTargetScore(customer: Customer, hasBooked: boolean, hasEnriched: boolean, _extCount: number): number {
  // Use the real score from the API directly.
  // The backend already accounts for external policies in its PIS calculation.
  return customer.protection_intelligence_score;
}

type ScoreTier = 'green' | 'yellow' | 'orange' | 'red';

const COVERAGE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  motor: 'truck',
  life: 'heart',
  health: 'activity',
  term: 'shield',
};

const HEADER_COPY: Record<ScoreTier, { label: string; heading: string }> = {
  green: {
    label: 'Excellent Security',
    heading: 'Premium high-priority risks covered',
  },
  yellow: {
    label: 'Fair Protection',
    heading: 'Essential covers in place — room to strengthen',
  },
  orange: {
    label: 'Limited Protection',
    heading: 'Key gaps detected — action recommended soon',
  },
  red: {
    label: 'Exposed Savings Risk',
    heading: 'Secure missing health and term gaps urgently',
  },
};

function getSafetyVerdict(score: number) {
  const tier: ScoreTier =
    score >= 70 ? 'green' : score >= 50 ? 'yellow' : score >= 20 ? 'orange' : 'red';
  const copy = HEADER_COPY[tier];
  return {
    tier,
    ...copy,
    progressFill: customerTheme.progressFill,
    progressTrack: customerTheme.progressTrack,
    pillText: customerTheme.accentDark,
    pillBg: customerTheme.accentSoft,
    pillBorder: customerTheme.accentBorder,
    accent: customerTheme.accent,
    ringColor: customerTheme.progressFill,
    chipText: customerTheme.accentDark,
    chipBg: customerTheme.accentSoft,
    chipBorder: customerTheme.accentBorder,
    headingColor: customerTheme.textPrimary,
    heroGradient: customerTheme.hero,
    heroGlowColor: 'rgba(59,130,246,0.06)',
    portalLabelColor: customerTheme.textMuted,
    scoreLabelColor: customerTheme.textSecondary,
    scoreSectionBg: 'rgba(255,255,255,0.88)',
    scoreSectionBorder: customerTheme.accentBorder,
    showShimmer: false,
    showRiskHint: tier === 'red' || tier === 'orange',
  };
}

function getBreakdownScore(
  customer: Customer,
  key: string,
  _hasBooked: boolean,
  _hasEnriched: boolean
): number {
  // Use the real score from the API directly.
  const row = customer.score_breakdown.find((r) => r.key === key);
  return row?.score ?? 0;
}

const LABEL_MAP: Record<string, string> = {
  coverage_adequacy: 'Medical & Health Shield',
  life_stage_readiness: 'Critical Life Benefit',
  financial_vulnerability: 'Vehicle Car Protection',
  family_risk_protection: 'Family Risk Shield',
  protection_freshness: 'Renewal Grace Alignment',
  engagement_strength: 'Active Security Checkpoints',
  data_confidence: 'Verified Document Records',
};

export default function ExpansionGlimpse({
  customer,
  hasBooked,
  hasEnriched,
  previewMode = false,
  onBack,
  fabBottomOffset = 64,
}: Props) {
  const insets = useSafeAreaInsets();
  const [externalPolicies, setExternalPolicies] = useState<ExternalPolicy[]>([
    {
      id: 'ext-p1',
      insurer: 'LIC of India',
      category: 'Term Life Insurance',
      sumInsured: '₹ 25,00,000',
      expiryDate: '2028-11-20',
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [extInsurer, setExtInsurer] = useState('');
  const [extCategory, setExtCategory] = useState('Health Insurance');
  const [extSumInsured, setExtSumInsured] = useState('');
  const [extExpiryDate, setExtExpiryDate] = useState('');
  const [extFile, setExtFile] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [coverageExpanded, setCoverageExpanded] = useState(false);
  const [externalExpanded, setExternalExpanded] = useState(false);
  const dismissToast = useCallback(() => setToast(null), []);
  const showToastMsg = useCallback((msg: string) => setToast(msg), []);
  const [displayScore, setDisplayScore] = useState(customer.protection_intelligence_score);

  const targetScore = getTargetScore(customer, hasBooked, hasEnriched, externalPolicies.length);
  const verdict = getSafetyVerdict(displayScore);
  const pulseScore =
    verdict.tier === 'red' ? 1.06 : verdict.tier === 'orange' ? 1.05 : verdict.tier === 'yellow' ? 1.04 : 1.02;
  const pulseDuration =
    verdict.tier === 'red' ? 1100 : verdict.tier === 'orange' ? 1250 : verdict.tier === 'yellow' ? 1400 : 1800;
  const showExposureTip = customer.weak_spots.length > 0;

  useEffect(() => {
    const start = displayScore;
    const end = targetScore;
    if (start === end) return;
    const startTime = Date.now();
    const duration = 1000;
    let raf = 0;
    const tick = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetScore]);

  const syncPolicy = () => {
    if (!extInsurer || !extSumInsured || !extExpiryDate) {
      showToastMsg('Please enter Insurer Name, Cover Amount, and Expiry Date.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExternalPolicies((prev) => [
      ...prev,
      { id: `ext-${Date.now()}`, insurer: extInsurer, category: extCategory, sumInsured: extSumInsured, expiryDate: extExpiryDate },
    ]);
    showToastMsg(`${extInsurer} policy synced. Safety index updated.`);
    setExtInsurer('');
    setExtSumInsured('');
    setExtExpiryDate('');
    setExtFile(null);
    setShowAddForm(false);
  };

  const getCoverageStatus = (row: Customer['coverage'][0]) => {
    // Use real coverage data from the API directly.
    return { covered: row.covered, source: row.source };
  };

  const coverageLabel = (id: string, name: string) => {
    if (id === 'motor') return 'Private Car HDFC Policy';
    if (id === 'life') return 'PB Legacy Corporate Life Plan';
    if (id === 'health') return 'Family Care Floater Plan';
    if (id === 'term') return 'Term Legacy Secure';
    return name;
  };

  const sourceLabel = (source: string | null) => {
    if (source === 'pb_held') return 'PB held';
    if (source === 'sold_by_agent') return 'Sold by you';
    if (source === 'added_by_agent') return 'Added by agent';
    return 'Exposure detected';
  };

  const breakdownRows = customer.score_breakdown;
  const visibleCoverage = coverageExpanded ? customer.coverage : customer.coverage.slice(0, 3);
  const coverageRemaining = Math.max(0, customer.coverage.length - 3);
  const visibleExternal = externalExpanded ? externalPolicies : externalPolicies.slice(0, 3);
  const externalRemaining = Math.max(0, externalPolicies.length - 3);

  const toggleCoverage = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCoverageExpanded((v) => !v);
  };
  const toggleExternal = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExternalExpanded((v) => !v);
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[...verdict.heroGradient]}
          style={[styles.hero, previewMode && { paddingTop: insets.top + space[2] }]}
        >
          <BreatheView
            style={[styles.heroGlow, { backgroundColor: verdict.heroGlowColor }]}
            duration={3000}
            min={0.2}
            max={0.7}
          />
          <View style={previewMode ? styles.heroNavPreview : styles.heroNavSimple}>
            {previewMode && onBack ? (
              <Pressable onPress={onBack} style={styles.heroBack} hitSlop={8}>
                <Feather name="chevron-left" size={22} color={customerTheme.textPrimary} />
              </Pressable>
            ) : null}
            <View style={previewMode ? styles.heroNavCenter : undefined}>
              <Text style={[styles.portalLabel, { color: verdict.portalLabelColor }]}>
                CUSTOMER SECURE PORTAL
              </Text>
              <Text style={styles.customerName}>{customer.name}</Text>
            </View>
            {previewMode ? <View style={styles.heroNavSpacer} /> : null}
          </View>

          <View
            style={[
              styles.scoreSection,
              {
                backgroundColor: verdict.scoreSectionBg,
                borderWidth: 1,
                borderColor: verdict.scoreSectionBorder,
                padding: space[3],
                marginTop: space[1],
              },
            ]}
          >
            {verdict.showShimmer && (
              <ShimmerBand bandWidth={64} duration={2800} style={styles.scoreShimmer} />
            )}
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreLabel, { color: verdict.scoreLabelColor }]}>
                My Protection Intelligence Score
              </Text>
              <PulseScale min={verdict.tier === 'red' ? 0.98 : 1} max={pulseScore} duration={pulseDuration}>
                <View
                  style={[
                    styles.verdictChip,
                    {
                      borderColor: verdict.chipBorder,
                      backgroundColor: verdict.chipBg,
                    },
                  ]}
                >
                  <LiveDot color={verdict.accent} size={6} style={styles.verdictLiveDot} />
                  <Text style={[styles.verdictText, { color: verdict.chipText }]}>{verdict.label}</Text>
                </View>
              </PulseScale>
              <BreatheView min={0.82} max={1} duration={verdict.tier === 'red' ? 1400 : 2200}>
                <Text style={[styles.scoreHeading, { color: verdict.headingColor }]}>{verdict.heading}</Text>
              </BreatheView>
              {verdict.showRiskHint && (
                <View style={[styles.exposureHint, { borderColor: verdict.chipBorder, backgroundColor: verdict.chipBg }]}>
                  <Feather name="alert-circle" size={14} color={customerTheme.accent} />
                  <Text style={[styles.exposureHintText, { color: verdict.chipText }]}>
                    Tap coverage gaps below to improve your score
                  </Text>
                </View>
              )}
            </View>
            <PulseScale min={1} max={pulseScore} duration={verdict.tier === 'red' ? 1200 : 2000}>
              <ScoreRing
                score={displayScore}
                size={112}
                strokeColor={verdict.ringColor}
                trackColor={customerTheme.progressTrack}
                textColor={customerTheme.textPrimary}
              />
            </PulseScale>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <FadeSlideIn index={0}>
          <View style={[styles.tipCard, showExposureTip && styles.tipCardAlert]}>
            {showExposureTip && <ShimmerBand bandWidth={48} duration={3200} style={styles.tipShimmer} />}
            <View style={styles.tipHeader}>
              <PulseScale min={1} max={1.12} duration={showExposureTip ? 1200 : 1800}>
                <View style={[styles.tipAi, showExposureTip && styles.tipAiAlert]}>
                  <Text style={styles.tipAiText}>{showExposureTip ? '!' : 'AI'}</Text>
                </View>
              </PulseScale>
              <Text style={styles.tipTitle}>
                {showExposureTip ? 'Savings Exposure Alert' : 'Your Safe Guard Pro Tip'}
              </Text>
              <View style={[styles.tipBadge, showExposureTip && styles.tipBadgeAlert]}>
                <LiveDot color={showExposureTip ? customerTheme.accent : customerTheme.textMuted} size={4} />
                <Text style={[styles.tipBadgeText, showExposureTip && styles.tipBadgeTextAlert]}>
                  {showExposureTip ? 'Action needed' : 'Smart Insight'}
                </Text>
              </View>
            </View>
            <Text style={styles.tipBody}>
              {customer.customerTip || (customer.customer_id === ANJALI_ID && !hasBooked
                ? 'Savings exposure detected: your motor policy renews in 9 days but you have no health coverage registered. Adding a combined health plan now can save up to 15% on combo premiums.'
                : 'Maintain verified covers to elevate your protection index. Stay in touch with your designated advisor.')}
            </Text>
            {showExposureTip && (
              <View style={styles.quoteRow}>
                <Text style={styles.quoteText} numberOfLines={2}>Combined Ergo Floater quote prepared for review</Text>
                <Pressable
                  onPress={() => showToastMsg('Opening secure checkout...')}
                  style={styles.buyBtnAlert}
                >
                  <PulseScale min={0.96} max={1.05} duration={900}>
                    <Text style={styles.buyBtnText}>Buy Now</Text>
                  </PulseScale>
                </Pressable>
              </View>
            )}
          </View>
          </FadeSlideIn>

          <FadeSlideIn index={1}>
          <ScoreBreakdownAccordion
            rows={breakdownRows}
            getScore={(key) => getBreakdownScore(customer, key, hasBooked, hasEnriched)}
            labelMap={LABEL_MAP}
          />
          </FadeSlideIn>

          <FadeSlideIn index={2}>
          <View style={styles.coverageHeader}>
            <Text style={styles.sectionLabel}>My Active and Unlinked Coverages</Text>
            <Text style={styles.ssl}>Secure</Text>
          </View>
          {visibleCoverage.map((row, i) => {
            const { covered, source } = getCoverageStatus(row);
            return (
              <FadeSlideIn key={row.id} index={i + 3}>
              <View style={[styles.coverageCard, shadows.card]}>
                <View style={styles.coverageLeft}>
                  <View style={styles.coverageIcon}>
                    <Feather name={COVERAGE_ICON[row.id] ?? 'shield'} size={16} color={customerTheme.accent} />
                  </View>
                  <View>
                    <Text style={styles.coverageName}>{coverageLabel(row.id, row.name)}</Text>
                    <Text style={[styles.coverageSource, !covered && styles.coverageSourceGap]}>
                      {covered ? `Source: ${sourceLabel(source)}` : 'Status: Exposure detected'}
                    </Text>
                  </View>
                </View>
                {covered ? (
                  <View style={styles.coveredChip}>
                    <Text style={styles.coveredText}>Covered</Text>
                  </View>
                ) : (
                  <PulseScale min={1} max={1.03} duration={1400}>
                    <Pressable
                      onPress={() => showToastMsg('Opening secure booking portal...')}
                      style={styles.gapBtn}
                    >
                      <Text style={styles.gapBtnText}>Buy Now</Text>
                    </Pressable>
                  </PulseScale>
                )}
              </View>
              </FadeSlideIn>
            );
          })}
          <AccordionToggle
            expanded={coverageExpanded}
            onToggle={toggleCoverage}
            remainingCount={coverageRemaining}
          />
          </FadeSlideIn>

          <FadeSlideIn index={6}>
          <View style={[styles.externalCard, shadows.card]}>
            <View style={styles.externalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.externalTitle}>POLICIES FROM OTHER INSURERS</Text>
                <Text style={styles.externalSub}>Declare active external policies to sync your overall risk index.</Text>
              </View>
              <Pressable onPress={() => setShowAddForm(!showAddForm)} style={styles.addBtn}>
                <PulseScale min={1} max={1.1} duration={1200}>
                  <Text style={styles.addBtnText}>+</Text>
                </PulseScale>
              </Pressable>
            </View>

            {showAddForm && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Link Outside Policy Details</Text>
                <Text style={styles.inputLabel}>Insurer Name</Text>
                <TextInput value={extInsurer} onChangeText={setExtInsurer} placeholder="e.g. Tata AIG, Max Life" style={styles.input} placeholderTextColor="#94A3B8" />
                <View style={styles.formRow}>
                  <View style={styles.formHalf}>
                    <Text style={styles.inputLabel}>Insurance Type</Text>
                    <TextInput value={extCategory} onChangeText={setExtCategory} style={styles.input} placeholderTextColor="#94A3B8" />
                  </View>
                  <View style={styles.formHalf}>
                    <Text style={styles.inputLabel}>Coverage Amount</Text>
                    <TextInput value={extSumInsured} onChangeText={setExtSumInsured} placeholder="₹ 10,00,000" style={styles.input} placeholderTextColor="#94A3B8" />
                  </View>
                </View>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput value={extExpiryDate} onChangeText={setExtExpiryDate} placeholder="YYYY-MM-DD" style={styles.input} placeholderTextColor="#94A3B8" />
                <Pressable
                  onPress={() => { setExtFile('policy.pdf'); showToastMsg('Policy document attached.'); }}
                  style={[styles.attachBtn, extFile && styles.attachReady]}
                >
                  <Text style={styles.attachText}>{extFile ? 'Document ready' : 'Attach PDF'}</Text>
                </Pressable>
                <Pressable onPress={syncPolicy} style={styles.syncBtn}>
                  <Text style={styles.syncText}>Sync This Policy</Text>
                </Pressable>
              </View>
            )}

            {externalPolicies.length === 0 ? (
              <Text style={styles.emptyExt}>No external policies added. Tap (+) to import.</Text>
            ) : (
              <>
                {visibleExternal.map((p) => (
                  <View key={p.id} style={styles.extRow}>
                    <View style={styles.extLeft}>
                      <View style={styles.extIcon}>
                        <Feather name="file-text" size={16} color={customerTheme.accent} />
                      </View>
                      <View>
                        <Text style={styles.extInsurer}>{p.insurer}</Text>
                        <Text style={styles.extMeta}>{p.category} · SI: {p.sumInsured} · Exp: {p.expiryDate}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        setExternalPolicies((prev) => prev.filter((x) => x.id !== p.id));
                        showToastMsg(`Removed policy from ${p.insurer}.`);
                      }}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={16} color={customerTheme.textMuted} />
                    </Pressable>
                  </View>
                ))}
                <AccordionToggle
                  expanded={externalExpanded}
                  onToggle={toggleExternal}
                  remainingCount={externalRemaining}
                />
              </>
            )}
          </View>
          </FadeSlideIn>

          <FadeSlideIn index={7}>
          <View style={[styles.advisorCard, shadows.card]}>
            <View style={styles.advisorLeft}>
              <View style={styles.advisorAvatar}><Text style={styles.advisorInitials}>RS</Text></View>
              <View>
                <Text style={styles.advisorTitle}>Designated Advisor</Text>
                <Text style={styles.advisorName}>Rahul Sharma</Text>
              </View>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL('tel:+91999999999'); }}
              style={styles.askBtn}
            >
              <Text style={styles.askText}>Call Support</Text>
            </Pressable>
          </View>
          </FadeSlideIn>
        </View>
      </ScrollView>
      <Toast message={toast} onHide={dismissToast} bottom={24} variant="green" />
      <CustomerAiAssistant customer={customer} bottomOffset={fabBottomOffset} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: customerTheme.canvas },
  scroll: { flex: 1 },
  content: { paddingBottom: 110 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroNavPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroNavSimple: {
    marginBottom: 20,
  },
  heroNavCenter: { flex: 1, alignItems: 'center' },
  heroNavSpacer: { width: 36 },
  heroBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalLabel: { fontFamily: fonts.headingExtra, fontSize: 8.5, letterSpacing: 1 },
  customerName: { fontFamily: fonts.headingExtra, fontSize: 15, color: customerTheme.textPrimary, marginTop: 4 },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreShimmer: { opacity: 0.45 },
  scoreInfo: { flex: 1, paddingRight: 12 },
  scoreLabel: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  verdictChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  verdictLiveDot: { marginRight: 6 },
  verdictText: { fontFamily: fonts.bodyBold, fontSize: 10.5 },
  scoreHeading: { fontFamily: fonts.bodySemi, fontSize: 12, marginTop: 10, lineHeight: 18 },
  exposureHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    marginTop: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  exposureHintIcon: { fontSize: 12 },
  exposureHintText: {
    fontFamily: fonts.bodySemi,
    fontSize: typeScale.caption.fontSize,
  },
  body: { padding: 16, gap: 14 },
  tipCard: {
    backgroundColor: 'rgba(236,253,245,0.7)',
    borderLeftWidth: 4,
    borderLeftColor: colors.customerGreen,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  tipCardAlert: {
    backgroundColor: 'rgba(255,251,235,0.95)',
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  tipShimmer: { opacity: 0.35 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipAi: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.customerGreen, alignItems: 'center', justifyContent: 'center' },
  tipAiAlert: { backgroundColor: '#F59E0B' },
  tipAiText: { color: '#FFF', fontSize: 9, fontFamily: fonts.headingExtra },
  tipTitle: { flex: 1, fontFamily: fonts.headingExtra, fontSize: 12, color: colors.navy, textTransform: 'uppercase' },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tipBadgeAlert: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)' },
  tipBadgeText: { fontFamily: fonts.bodyBold, fontSize: 8, color: '#065F46' },
  tipBadgeTextAlert: { color: '#92400E' },
  tipBody: { fontFamily: fonts.body, fontSize: 11, color: '#475569', lineHeight: 17 },
  quoteRow: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  quoteText: { flex: 1, fontFamily: fonts.body, fontSize: 10, color: colors.body },
  buyBtn: { backgroundColor: colors.customerGreen, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  buyBtnAlert: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  buyBtnText: { fontFamily: fonts.headingExtra, fontSize: 9.5, color: '#FFF' },
  sectionLabel: { fontFamily: fonts.headingExtra, fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[2] },
  ssl: { fontFamily: fonts.bodySemi, fontSize: 10, color: customerTheme.accent },
  coverageCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: space[2],
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: customerTheme.accentBorder,
  },
  coverageLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  coverageIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: customerTheme.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: customerTheme.accentBorder,
  },
  coverageName: { fontFamily: fonts.headingExtra, fontSize: 12.5, color: customerTheme.textPrimary },
  coverageSource: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: customerTheme.textMuted, marginTop: 2 },
  coverageSourceGap: { color: customerTheme.accentDark },
  coveredChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: customerTheme.accentSoft,
    borderColor: customerTheme.accentBorder,
  },
  coveredText: { fontFamily: fonts.headingExtra, fontSize: 11, color: customerTheme.accentDark },
  gapBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: customerTheme.accent,
    borderColor: customerTheme.accent,
  },
  gapBtnText: { fontFamily: fonts.headingExtra, fontSize: 10, color: '#FFF' },
  externalCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: customerTheme.accentBorder },
  externalHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  externalTitle: { fontFamily: fonts.headingExtra, fontSize: 10, color: customerTheme.accent, letterSpacing: 0.5 },
  externalSub: { fontFamily: fonts.body, fontSize: 11, color: customerTheme.textSecondary, marginTop: 4 },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: customerTheme.accent, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontSize: 18, lineHeight: 20 },
  form: { backgroundColor: customerTheme.accentSoft, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: customerTheme.accentBorder, gap: 8 },
  formTitle: { fontFamily: fonts.headingExtra, fontSize: 11, color: customerTheme.accentDark, textTransform: 'uppercase' },
  inputLabel: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: customerTheme.textSecondary, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: customerTheme.accentBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontFamily: fonts.body, fontSize: 11, color: customerTheme.textPrimary },
  formRow: { flexDirection: 'row', gap: 8 },
  formHalf: { flex: 1 },
  attachBtn: { borderWidth: 1, borderColor: customerTheme.accentBorder, borderStyle: 'dashed', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#FFF' },
  attachReady: { borderColor: customerTheme.accent, backgroundColor: customerTheme.accentSoft },
  attachText: { fontFamily: fonts.bodySemi, fontSize: 11, color: customerTheme.textSecondary },
  syncBtn: { backgroundColor: customerTheme.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  syncText: { fontFamily: fonts.headingExtra, fontSize: 11, color: '#FFF' },
  emptyExt: { fontFamily: fonts.body, fontSize: 11, color: customerTheme.textMuted, textAlign: 'center', paddingVertical: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: customerTheme.accentBorder, borderRadius: 12 },
  extRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: customerTheme.accentSoft, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: customerTheme.accentBorder },
  extLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  extIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: customerTheme.accentBorder },
  extInsurer: { fontFamily: fonts.headingExtra, fontSize: 12, color: customerTheme.textPrimary },
  extMeta: { fontFamily: fonts.body, fontSize: 9.5, color: customerTheme.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 6 },
  advisorCard: { backgroundColor: colors.white, borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: customerTheme.accentBorder },
  advisorLeft: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  advisorAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: customerTheme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  advisorInitials: { fontFamily: fonts.headingExtra, fontSize: 11, color: customerTheme.accentDark },
  advisorTitle: { fontFamily: fonts.headingExtra, fontSize: 11, color: customerTheme.textPrimary },
  advisorName: { fontFamily: fonts.body, fontSize: 9, color: customerTheme.textSecondary, marginTop: 2 },
  askBtn: { backgroundColor: customerTheme.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: customerTheme.accentBorder },
  askText: { fontFamily: fonts.headingExtra, fontSize: 10, color: customerTheme.accentDark },
});
