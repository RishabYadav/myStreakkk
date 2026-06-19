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
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../theme';
import { customerTheme } from '../theme/customerTheme';
import { Customer } from '../types';
import ScoreMeter from '../components/ScoreMeter';
import Toast from '../components/ui/Toast';
import AccordionToggle from '../components/ui/AccordionToggle';
import { FadeSlideIn, PulseScale, ShimmerBand } from '../components/ui/motion';
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
  const gaugeTier =
    tier === 'green'
      ? { color: '#059669', bg: '#D1FAE5' }
      : tier === 'yellow'
        ? { color: '#B45309', bg: '#FEF3C7' }
        : tier === 'orange'
          ? { color: '#C2410C', bg: '#FFEDD5' }
          : { color: '#DC2626', bg: '#FEE2E2' };
  return {
    tier,
    ...copy,
    ...gaugeTier,
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

  const exposureBody =
    customer.customerTip ||
    (customer.customer_id === ANJALI_ID && !hasBooked
      ? 'Your family floater quote is ready — Family Care Floater Plan, prepared with Ergo for your review. Closing this gap is your single biggest lift to your protection score.'
      : 'Maintain verified covers to elevate your protection index. Stay in touch with your designated advisor.');

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.topSection, previewMode && { paddingTop: insets.top + space[2] }]}>
          <View style={previewMode ? styles.heroNavPreview : styles.portalHeader}>
            {previewMode && onBack ? (
              <Pressable onPress={onBack} style={styles.heroBack} hitSlop={8}>
                <Feather name="chevron-left" size={22} color={customerTheme.textPrimary} />
              </Pressable>
            ) : null}
            <View style={previewMode ? styles.heroNavCenter : undefined}>
              <Text style={styles.portalLabel}>CUSTOMER SECURE PORTAL</Text>
              <Text style={styles.customerName}>{customer.name}</Text>
            </View>
            {previewMode ? <View style={styles.heroNavSpacer} /> : null}
          </View>

          <FadeSlideIn index={0}>
            <View style={[styles.scoreCard, shadows.cardLifted]}>
              <Text style={styles.scoreEyebrow}>My Protection Intelligence Score</Text>
              <ScoreMeter
                score={displayScore}
                width={280}
                interactive={false}
                scoreFirst
                showOutOf100
                tierLabel={verdict.label}
                tierColor={verdict.color}
                tierBg={verdict.bg}
                subtitle={verdict.heading}
                scoreColor="#1E3A8A"
              />
            </View>
          </FadeSlideIn>

          <FadeSlideIn index={1}>
            <View style={[styles.tipCard, showExposureTip && styles.tipCardAlert]}>
              {showExposureTip && <ShimmerBand bandWidth={48} duration={3200} style={styles.tipShimmer} />}
              <View style={styles.tipHeader}>
                <View style={[styles.tipAi, showExposureTip && styles.tipAiAlert]}>
                  <Text style={styles.tipAiText}>{showExposureTip ? '!' : 'AI'}</Text>
                </View>
                <Text style={styles.tipTitle}>
                  {showExposureTip ? 'Savings exposure alert' : 'Your Safe Guard Pro Tip'}
                </Text>
                <View style={[styles.tipBadge, showExposureTip && styles.tipBadgeAlert]}>
                  <Text style={[styles.tipBadgeText, showExposureTip && styles.tipBadgeTextAlert]}>
                    {showExposureTip ? 'Action needed' : 'Smart Insight'}
                  </Text>
                </View>
              </View>
              <Text style={styles.tipBody}>
                {showExposureTip ? (
                  <>
                    Your family floater quote is ready —{' '}
                    <Text style={styles.tipBodyBold}>Family Care Floater Plan</Text>, prepared with Ergo for
                    your review. Closing this gap is your single biggest lift to your protection score.
                  </>
                ) : (
                  exposureBody
                )}
              </Text>
              {showExposureTip && (
                <Pressable
                  onPress={() => showToastMsg('Opening secure checkout...')}
                  style={styles.buyBtnFull}
                >
                  <Text style={styles.buyBtnFullText}>Buy now</Text>
                </Pressable>
              )}
            </View>
          </FadeSlideIn>
        </View>

        <View style={styles.body}>
          <FadeSlideIn index={2}>
          <ScoreBreakdownAccordion
            rows={breakdownRows}
            getScore={(key) => getBreakdownScore(customer, key, hasBooked, hasEnriched)}
            labelMap={LABEL_MAP}
          />
          </FadeSlideIn>

          <FadeSlideIn index={3}>
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
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  portalHeader: {
    marginBottom: 2,
  },
  heroNavPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  portalLabel: {
    fontFamily: fonts.headingExtra,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  customerName: {
    fontFamily: fonts.headingExtra,
    fontSize: 28,
    color: '#1E3A8A',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: space[4],
    paddingBottom: space[2],
    paddingHorizontal: space[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  scoreEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#64748B',
    marginBottom: space[1],
  },
  body: { padding: 16, gap: 14, paddingTop: 8 },
  tipCard: {
    backgroundColor: 'rgba(236,253,245,0.7)',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  tipCardAlert: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  tipShimmer: { opacity: 0.35 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipAi: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.customerGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipAiAlert: { backgroundColor: '#F59E0B' },
  tipAiText: { color: '#FFF', fontSize: 14, fontFamily: fonts.headingExtra },
  tipTitle: {
    flex: 1,
    fontFamily: fonts.headingExtra,
    fontSize: 14,
    color: '#1E3A8A',
  },
  tipBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tipBadgeAlert: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)' },
  tipBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#065F46' },
  tipBadgeTextAlert: { color: '#92400E' },
  tipBody: { fontFamily: fonts.body, fontSize: 13, color: '#475569', lineHeight: 20 },
  tipBodyBold: { fontFamily: fonts.bodyBold, color: '#0F172A' },
  buyBtnFull: {
    marginTop: 14,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buyBtnFullText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#FFF' },
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
