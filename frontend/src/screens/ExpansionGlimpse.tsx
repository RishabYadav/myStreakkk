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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../theme';
import { Customer } from '../types';
import ScoreRing from '../components/ScoreRing';
import PartnerCustomerToggle from '../components/PartnerCustomerToggle';
import Toast from '../components/ui/Toast';
import { AnimatedProgressBar, BreatheView, FadeSlideIn, FloatView, LiveDot, PulseScale, ShimmerBand, WiggleView } from '../components/ui/motion';
import CustomerAiAssistant from '../components/customer/CustomerAiAssistant';

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
  viewMode: 'streak' | 'customer_pov';
  onChangeView: (mode: 'streak' | 'customer_pov') => void;
  fabBottomOffset?: number;
}

function getTargetScore(customer: Customer, hasBooked: boolean, hasEnriched: boolean, extCount: number): number {
  let base = customer.protection_intelligence_score;
  if (customer.customer_id === ANJALI_ID) {
    if (hasBooked && hasEnriched) base = 84;
    else if (hasBooked) base = 75;
    else if (hasEnriched) base = 71;
  }
  return Math.min(base + extCount * 4, 98);
}

type ScoreTier = 'green' | 'yellow' | 'orange' | 'red';

function getScoreTheme(value: number) {
  if (value >= 70) {
    return {
      tier: 'green' as ScoreTier,
      progressFill: colors.customerGreen,
      pillText: '#065F46',
      pillBg: '#ECFDF5',
      pillBorder: '#A7F3D0',
      accent: '#6EE7B7',
      ringColor: '#6EE7B7',
      chipText: '#ECFDF5',
      chipBg: 'rgba(110,231,183,0.18)',
      chipBorder: 'rgba(110,231,183,0.45)',
      headingColor: 'rgba(167,243,208,0.95)',
      heroGradient: ['#064E3B', '#059669', '#047857'] as const,
      heroGlowColor: 'rgba(255,255,255,0.08)',
      portalLabelColor: 'rgba(167,243,208,0.9)',
      scoreLabelColor: 'rgba(167,243,208,0.95)',
      scoreSectionBg: 'rgba(255,255,255,0.06)',
      scoreSectionBorder: 'rgba(110,231,183,0.25)',
    };
  }
  if (value >= 50) {
    return {
      tier: 'yellow' as ScoreTier,
      progressFill: '#EAB308',
      pillText: '#713F12',
      pillBg: '#FEF9C3',
      pillBorder: '#FDE047',
      accent: '#FACC15',
      ringColor: '#EAB308',
      chipText: '#FEFCE8',
      chipBg: 'rgba(234, 179, 8, 0.28)',
      chipBorder: 'rgba(253, 224, 71, 0.55)',
      headingColor: 'rgba(254, 249, 195, 0.96)',
      heroGradient: ['#422006', '#A16207', '#CA8A04', '#FACC15'] as const,
      heroGlowColor: 'rgba(250, 204, 21, 0.22)',
      portalLabelColor: 'rgba(254, 240, 138, 0.95)',
      scoreLabelColor: 'rgba(254, 249, 195, 0.98)',
      scoreSectionBg: 'rgba(250, 204, 21, 0.14)',
      scoreSectionBorder: 'rgba(253, 224, 71, 0.42)',
    };
  }
  if (value >= 20) {
    return {
      tier: 'orange' as ScoreTier,
      progressFill: '#F97316',
      pillText: '#7C2D12',
      pillBg: '#FFEDD5',
      pillBorder: '#FB923C',
      accent: '#FB923C',
      ringColor: '#F97316',
      chipText: '#FFF7ED',
      chipBg: 'rgba(234, 88, 12, 0.3)',
      chipBorder: 'rgba(251, 146, 60, 0.58)',
      headingColor: 'rgba(255, 237, 213, 0.96)',
      heroGradient: ['#431407', '#9A3412', '#EA580C', '#FB923C'] as const,
      heroGlowColor: 'rgba(251, 146, 60, 0.2)',
      portalLabelColor: 'rgba(254, 215, 170, 0.95)',
      scoreLabelColor: 'rgba(255, 237, 213, 0.98)',
      scoreSectionBg: 'rgba(234, 88, 12, 0.16)',
      scoreSectionBorder: 'rgba(249, 115, 22, 0.48)',
    };
  }
  return {
    tier: 'red' as ScoreTier,
    progressFill: '#EF4444',
    pillText: '#991B1B',
    pillBg: '#FEE2E2',
    pillBorder: '#FECACA',
    accent: '#FCA5A5',
    ringColor: '#EF4444',
    chipText: '#FEE2E2',
    chipBg: 'rgba(239,68,68,0.24)',
    chipBorder: 'rgba(248,113,113,0.55)',
    headingColor: 'rgba(254,226,226,0.95)',
    heroGradient: ['#450A0A', '#991B1B', '#DC2626'] as const,
    heroGlowColor: 'rgba(254,202,202,0.1)',
    portalLabelColor: 'rgba(254,202,202,0.9)',
    scoreLabelColor: 'rgba(254,226,226,0.95)',
    scoreSectionBg: 'rgba(239,68,68,0.12)',
    scoreSectionBorder: 'rgba(248,113,113,0.35)',
  };
}

const HEADER_COPY: Record<ScoreTier, { label: string; heading: string }> = {
  green: {
    label: 'Excellent Security',
    heading: 'Premium High-Priority Risks Covered!',
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
    heading: 'Secure missing health & term gaps urgently',
  },
};

function getSafetyVerdict(score: number) {
  const theme = getScoreTheme(score);
  return {
    ...theme,
    ...HEADER_COPY[theme.tier],
    showShimmer: theme.tier !== 'green',
    showRiskHint: theme.tier === 'red' || theme.tier === 'orange',
  };
}

function getBreakdownScore(
  customer: Customer,
  key: string,
  hasBooked: boolean,
  hasEnriched: boolean
): number {
  const row = customer.score_breakdown.find((r) => r.key === key);
  if (!row) return 0;
  if (customer.customer_id !== ANJALI_ID) return row.score;
  if (key === 'coverage_adequacy' && hasBooked) return hasEnriched ? 22 : 18;
  if (key === 'family_risk_protection' && hasBooked) return hasEnriched ? 9 : 8;
  if (key === 'data_confidence' && hasEnriched) return 9;
  return row.score;
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
  viewMode,
  onChangeView,
  fabBottomOffset = 64,
}: Props) {
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
  const dismissToast = useCallback(() => setToast(null), []);
  const showToastMsg = useCallback((msg: string) => setToast(msg), []);
  const [displayScore, setDisplayScore] = useState(customer.protection_intelligence_score);

  const targetScore = getTargetScore(customer, hasBooked, hasEnriched, externalPolicies.length);
  const verdict = getSafetyVerdict(displayScore);
  const pulseScore =
    verdict.tier === 'red' ? 1.06 : verdict.tier === 'orange' ? 1.05 : verdict.tier === 'yellow' ? 1.04 : 1.02;
  const pulseDuration =
    verdict.tier === 'red' ? 1100 : verdict.tier === 'orange' ? 1250 : verdict.tier === 'yellow' ? 1400 : 1800;
  const showExposureTip = customer.customer_id === ANJALI_ID && !hasBooked;

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
      showToastMsg('⚠️ Please enter Insurer Name, Cover Amount, and Expiry Date!');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExternalPolicies((prev) => [
      ...prev,
      { id: `ext-${Date.now()}`, insurer: extInsurer, category: extCategory, sumInsured: extSumInsured, expiryDate: extExpiryDate },
    ]);
    showToastMsg(`🎉 ${extInsurer} Policy synced. Safety index increased!`);
    setExtInsurer('');
    setExtSumInsured('');
    setExtExpiryDate('');
    setExtFile(null);
    setShowAddForm(false);
  };

  const getCoverageStatus = (row: Customer['coverage'][0]) => {
    if (customer.customer_id !== ANJALI_ID) return { covered: row.covered, source: row.source };
    if (row.id === 'health' && hasBooked) return { covered: true, source: 'sold_by_agent' as const };
    if (row.id === 'term' && hasEnriched) return { covered: true, source: 'added_by_agent' as const };
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

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...verdict.heroGradient]} style={styles.hero}>
          <BreatheView
            style={[styles.heroGlow, { backgroundColor: verdict.heroGlowColor }]}
            duration={3000}
            min={0.2}
            max={0.7}
          />
          <View style={styles.heroNav}>
            <View>
              <Text style={[styles.portalLabel, { color: verdict.portalLabelColor }]}>
                CUSTOMER SECURE PORTAL
              </Text>
              <Text style={styles.customerName}>{customer.name}</Text>
            </View>
            <PartnerCustomerToggle activeMode={viewMode} onChange={onChangeView} variant="customer" />
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
                  <WiggleView angle={4} duration={2600}>
                    <Text style={styles.exposureHintIcon}>⚠️</Text>
                  </WiggleView>
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
                trackColor="rgba(255,255,255,0.14)"
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
                <LiveDot color={showExposureTip ? '#FBBF24' : colors.customerGreen} size={4} />
                <Text style={[styles.tipBadgeText, showExposureTip && styles.tipBadgeTextAlert]}>
                  {showExposureTip ? 'Action needed' : 'Smart Insight'}
                </Text>
              </View>
            </View>
            <Text style={styles.tipBody}>
              {customer.customer_id === ANJALI_ID && !hasBooked
                ? '💡 Savings Exposure Detected: Your motor policy renews in 9 days but you have zero health files registered. Linking combined health plans now saves up to 15% in combo premiums!'
                : customer.customer_id === ANJALI_ID
                  ? '🎉 Perfect Combo Alignment: Your Ergo Combo Family health plan with Motor coverage maximizes tax exemptions and top-tier claim settlement ratios!'
                  : '💡 Maintain verified covers to elevate your protection index. Keep coordination active with your designated partner advisor.'}
            </Text>
            {showExposureTip && (
              <View style={styles.quoteRow}>
                <Text style={styles.quoteText} numberOfLines={1}>🎯 Combined Ergo Floater quote prepared</Text>
                <Pressable
                  onPress={() => showToastMsg('🛒 Directing to secure Checkout payment gateway...')}
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
          <View style={[styles.breakdownCard, shadows.card]}>
            <Text style={styles.sectionLabel}>🛡️ My Safety Index Breakdown</Text>
            {customer.score_breakdown.map((row) => {
              const current = getBreakdownScore(customer, row.key, hasBooked, hasEnriched);
              const pct = Math.min((current / row.max) * 100, 100);
              const rowTheme = getScoreTheme(pct);
              return (
                <View key={row.key} style={styles.breakdownRow}>
                  <View style={styles.breakdownTop}>
                    <Text style={styles.breakdownName}>{LABEL_MAP[row.key] ?? row.name}</Text>
                    <Text
                      style={[
                        styles.breakdownVal,
                        {
                          color: rowTheme.pillText,
                          backgroundColor: rowTheme.pillBg,
                          borderColor: rowTheme.pillBorder,
                        },
                      ]}
                    >
                      {current}/{row.max} Value
                    </Text>
                  </View>
                  <AnimatedProgressBar
                    pct={pct}
                    fillColor={rowTheme.progressFill}
                    trackColor={colors.border.subtle}
                    height={6}
                  />
                </View>
              );
            })}
          </View>
          </FadeSlideIn>

          <FadeSlideIn index={2}>
          <View style={styles.coverageHeader}>
            <Text style={styles.sectionLabel}>My Active & Unlinked Coverages</Text>
            <Text style={styles.ssl}>🔒 SSL ENCRYPTED</Text>
          </View>
          {customer.coverage.map((row, i) => {
            const { covered, source } = getCoverageStatus(row);
            const rowTheme = getScoreTheme(covered ? 85 : 12);
            return (
              <FadeSlideIn key={row.id} index={i + 3}>
              <View style={[styles.coverageCard, shadows.card]}>
                <View style={styles.coverageLeft}>
                  <FloatView distance={2} duration={2400} delay={i * 80}>
                    <View style={[styles.coverageIcon, { borderColor: rowTheme.pillBorder, backgroundColor: rowTheme.pillBg }]}>
                      <Text>{row.icon}</Text>
                    </View>
                  </FloatView>
                  <View>
                    <Text style={styles.coverageName}>{coverageLabel(row.id, row.name)}</Text>
                    <Text style={[styles.coverageSource, !covered && { color: rowTheme.pillText }]}>
                      {covered ? `Source: ${sourceLabel(source)}` : 'Status: Exposure detected'}
                    </Text>
                  </View>
                </View>
                {covered ? (
                  <View style={[styles.coveredChip, { backgroundColor: rowTheme.pillBg, borderColor: rowTheme.pillBorder }]}>
                    <Text style={[styles.coveredText, { color: rowTheme.pillText }]}>✓ Covered</Text>
                  </View>
                ) : (
                  <PulseScale min={1} max={1.05} duration={1400}>
                    <Pressable
                      onPress={() => showToastMsg(row.id === 'health' ? '🌟 Opening secure booking portal...' : '📁 Launching secure PDF uploader...')}
                      style={[styles.gapBtn, { backgroundColor: rowTheme.pillBg, borderColor: rowTheme.pillBorder }]}
                    >
                      <Text style={[styles.gapBtnText, { color: rowTheme.pillText }]}>
                        {row.id === 'health' ? 'Buy Now' : 'Link External'}
                      </Text>
                    </Pressable>
                  </PulseScale>
                )}
              </View>
              </FadeSlideIn>
            );
          })}
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
                  onPress={() => { setExtFile('policy.pdf'); showToastMsg('📂 Linked external policy document.'); }}
                  style={[styles.attachBtn, extFile && styles.attachReady]}
                >
                  <Text style={styles.attachText}>{extFile ? '✓ Ready!' : '📎 Attach PDF'}</Text>
                </Pressable>
                <Pressable onPress={syncPolicy} style={styles.syncBtn}>
                  <Text style={styles.syncText}>Sync This Policy</Text>
                </Pressable>
              </View>
            )}

            {externalPolicies.length === 0 ? (
              <Text style={styles.emptyExt}>No external policies added. Tap (+) to import.</Text>
            ) : (
              externalPolicies.map((p) => (
                <View key={p.id} style={styles.extRow}>
                  <View style={styles.extLeft}>
                    <View style={styles.extIcon}><Text>📄</Text></View>
                    <View>
                      <Text style={styles.extInsurer}>{p.insurer}</Text>
                      <Text style={styles.extMeta}>{p.category} · SI: {p.sumInsured} · Exp: {p.expiryDate}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      setExternalPolicies((prev) => prev.filter((x) => x.id !== p.id));
                      showToastMsg(`🗑️ De-linked policy from ${p.insurer}.`);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text>🗑️</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
          </FadeSlideIn>

          <FadeSlideIn index={7}>
          <View style={[styles.advisorCard, shadows.card]}>
            <View style={styles.advisorLeft}>
              <View style={styles.advisorAvatar}><Text style={styles.advisorInitials}>RS</Text></View>
              <View>
                <Text style={styles.advisorTitle}>Designated Advisor</Text>
                <Text style={styles.advisorName}>Rahul Sharma (PB Partners)</Text>
              </View>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL('tel:+91999999999'); }}
              style={styles.askBtn}
            >
              <Text style={styles.askText}>Ask Rahul</Text>
            </Pressable>
          </View>
          </FadeSlideIn>

          <FadeSlideIn index={8}>
          <Text style={styles.vault}>🛡️ PBPartners Secure Protection Vault</Text>
          </FadeSlideIn>
        </View>
      </ScrollView>
      <Toast message={toast} onHide={dismissToast} bottom={24} variant="green" />
      <CustomerAiAssistant customer={customer} bottomOffset={fabBottomOffset} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvasAlt },
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
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  portalLabel: { fontFamily: fonts.headingExtra, fontSize: 8.5, letterSpacing: 1 },
  customerName: { fontFamily: fonts.headingExtra, fontSize: 15, color: '#FFF', marginTop: 4 },
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
  breakdownCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionLabel: { fontFamily: fonts.headingExtra, fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  breakdownRow: { marginBottom: 12 },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  breakdownName: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.navy },
  breakdownVal: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.customerGreen, borderRadius: 3 },
  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ssl: { fontFamily: fonts.headingExtra, fontSize: 10, color: colors.customerGreen },
  coverageCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  coverageLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  coverageIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  coverageName: { fontFamily: fonts.headingExtra, fontSize: 12.5, color: colors.navy },
  coverageSource: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: '#94A3B8', marginTop: 2 },
  coveredChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  coveredText: { fontFamily: fonts.headingExtra, fontSize: 11 },
  gapBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  gapBtnText: { fontFamily: fonts.headingExtra, fontSize: 10 },
  externalCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  externalHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  externalTitle: { fontFamily: fonts.headingExtra, fontSize: 10, color: colors.customerGreen, letterSpacing: 0.5 },
  externalSub: { fontFamily: fonts.body, fontSize: 11, color: colors.body, marginTop: 4 },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.customerGreen, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFF', fontSize: 18, lineHeight: 20 },
  form: { backgroundColor: 'rgba(236,253,245,0.3)', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#D1FAE5', gap: 8 },
  formTitle: { fontFamily: fonts.headingExtra, fontSize: 11, color: colors.customerGreen, textTransform: 'uppercase' },
  inputLabel: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.body, textTransform: 'uppercase' },
  input: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontFamily: fonts.body, fontSize: 11, color: colors.navy },
  formRow: { flexDirection: 'row', gap: 8 },
  formHalf: { flex: 1 },
  attachBtn: { borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#F8FAFC' },
  attachReady: { borderColor: '#6EE7B7', backgroundColor: '#ECFDF5' },
  attachText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.body },
  syncBtn: { backgroundColor: colors.customerGreen, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  syncText: { fontFamily: fonts.headingExtra, fontSize: 11, color: '#FFF' },
  emptyExt: { fontFamily: fonts.body, fontSize: 11, color: '#94A3B8', textAlign: 'center', paddingVertical: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E2E8F0', borderRadius: 12 },
  extRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  extLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  extIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  extInsurer: { fontFamily: fonts.headingExtra, fontSize: 12, color: colors.navy },
  extMeta: { fontFamily: fonts.body, fontSize: 9.5, color: colors.body, marginTop: 2 },
  deleteBtn: { padding: 6 },
  advisorCard: { backgroundColor: colors.white, borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  advisorLeft: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  advisorAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  advisorInitials: { fontFamily: fonts.headingExtra, fontSize: 11, color: colors.customerGreen },
  advisorTitle: { fontFamily: fonts.headingExtra, fontSize: 11, color: colors.navy },
  advisorName: { fontFamily: fonts.body, fontSize: 9, color: colors.body, marginTop: 2 },
  askBtn: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D1FAE5' },
  askText: { fontFamily: fonts.headingExtra, fontSize: 10, color: colors.customerGreen },
  vault: { fontFamily: fonts.headingExtra, fontSize: 9, color: '#94A3B8', textAlign: 'center', letterSpacing: 1, marginTop: 4 },
});
