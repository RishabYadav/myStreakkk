import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
  PanResponder,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../theme';
import { AgentState, AiSlide, MissionItem } from '../types';
import { AI_SLIDES, ACTIVE_MISSIONS, FALLBACK_MISSIONS } from '../mockData';
import { formatCountdown } from '../utils';
import { getTimeGreeting } from '../utils/timeGreeting';
import RewardsDesk from '../components/streak/RewardsDesk';
import PartnerScreenHeader from '../components/partner/PartnerScreenHeader';
import Toast from '../components/ui/Toast';
import PressableScale from '../components/ui/PressableScale';
import Button from '../components/ui/Button';
import CoinIcon from '../components/ui/CoinIcon';
import CoinInline from '../components/ui/CoinInline';
import {
  BreatheView,
  CarouselDot,
  FadeSlideIn,
  FloatView,
  LiveDot,
  PulseScale,
  ShimmerBand,
  WiggleView,
} from '../components/ui/motion';

interface Props {
  agent: AgentState;
  hasBooked: boolean;
  completedMissionIds: string[];
  onOpenBooking: (mission: MissionItem) => void;
  onUpdateCoins: (amount: number) => void;
  onDemoReset: () => void;
  onBack: () => void;
  proactiveInsights?: AiSlide[] | null;
  suggestedMission?: MissionItem | null;
  dataLoading?: boolean;
  onRefreshData?: () => Promise<void>;
}

const MILESTONES = [
  { label: 'D7', done: true },
  { label: 'D14', done: true },
  { label: 'D30', done: true },
  { label: 'Today', current: true },
  { label: 'D60', locked: true },
];

const MISSION_ICONS: Record<MissionItem['icon'], string> = {
  sparkles: '✨',
  users: '👥',
  clipboard: '📋',
  shield: '🛡️',
  mail: '✉️',
  share: '📤',
  refresh: '🔄',
};

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDE_W = SCREEN_W - space[4] * 2 - space[3] * 2;

function SwipeableMission({
  mission,
  completed,
  index,
  onPress,
  onDismiss,
}: {
  mission: MissionItem;
  completed: boolean;
  index: number;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const isCompleted = completed;
  const isSuggested = !!mission.urgent && !isCompleted;
  const pan = useRef(new Animated.ValueXY()).current;
  const dismissOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dismissOpacity, {
          toValue: 0.65,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dismissOpacity, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [dismissOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12,
      onPanResponderMove: (_, g) => {
        pan.setValue({ x: g.dx, y: 0 });
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 75) {
          Animated.timing(pan, { toValue: { x: g.dx > 0 ? 400 : -400, y: 0 }, duration: 200, useNativeDriver: true }).start(onDismiss);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <FadeSlideIn index={index} style={styles.missionSwipeWrap}>
      <Animated.View style={[styles.dismissHint, { opacity: dismissOpacity }]}>
        <Text style={styles.dismissText}>← Swipe to Dismiss</Text>
        <Text style={styles.dismissText}>Swipe to Dismiss →</Text>
      </Animated.View>
      <Animated.View
        style={{ transform: [{ translateX: pan.x }] }}
        {...panResponder.panHandlers}
      >
        <PressableScale
          onPress={onPress}
          style={[
            styles.missionCard,
            isCompleted && styles.missionDone,
            isSuggested && styles.missionSuggested,
          ]}
        >
          {isSuggested && <ShimmerBand bandWidth={56} duration={3000} />}
          {isSuggested && (
            <BreatheView style={styles.missionAccent} duration={1600} min={0.45} max={1} />
          )}
          {isCompleted && <View style={styles.missionAccentDone} />}
          {isSuggested && (
            <View style={styles.suggestedBadge}>
              <LiveDot color={colors.partner.accent} size={5} />
              <Text style={styles.suggestedText}>Suggested for you</Text>
            </View>
          )}
          <View style={styles.missionRow}>
            <View style={[styles.missionIcon, isSuggested && styles.missionIconAi]}>
              {isSuggested ? (
                <PulseScale min={0.92} max={1.08} duration={1400}>
                  <WiggleView duration={2400}>
                    <Text style={styles.missionIconText}>{MISSION_ICONS[mission.icon]}</Text>
                  </WiggleView>
                </PulseScale>
              ) : (
                <FloatView distance={2} duration={2600} delay={index * 120}>
                  <Text style={styles.missionIconText}>{MISSION_ICONS[mission.icon]}</Text>
                </FloatView>
              )}
            </View>
            <View style={styles.missionInfo}>
              <View style={styles.missionTitleRow}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                {isCompleted && <Text style={styles.doneChip}>✓ DONE</Text>}
              </View>
              <Text style={styles.missionDesc}>{mission.desc}</Text>
            </View>
            <View style={styles.missionCoins}>
              {isCompleted ? (
                <PulseScale min={1} max={1.08} duration={1200}>
                  <View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View>
                </PulseScale>
              ) : (
                <>
                  <View style={styles.coinAmtRow}>
                    <CoinIcon size="xs" float={isSuggested} />
                    <Text style={[styles.coinAmt, isSuggested && styles.coinAmtHighlight]}>
                      {mission.coins}
                    </Text>
                  </View>
                  <Text style={styles.coinLbl}>COINS</Text>
                </>
              )}
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    </FadeSlideIn>
  );
}

export default function StreakHome({
  agent,
  hasBooked,
  completedMissionIds,
  onOpenBooking,
  onUpdateCoins,
  onDemoReset,
  onBack,
  proactiveInsights,
  suggestedMission,
  dataLoading,
  onRefreshData,
}: Props) {
  const timeGreeting = useMemo(() => getTimeGreeting(), []);
  const insightSlides = proactiveInsights?.length ? proactiveInsights : AI_SLIDES;
  const [timer, setTimer] = useState(81574);
  const [slideIdx, setSlideIdx] = useState(0);
  const [activeMissions, setActiveMissions] = useState<MissionItem[]>(ACTIVE_MISSIONS);
  const [fallbackMissions, setFallbackMissions] = useState<MissionItem[]>(FALLBACK_MISSIONS);
  const [toast, setToast] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [badgeModal, setBadgeModal] = useState<{
    name: string; emoji: string; day: string; description: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const carouselRef = useRef<FlatList>(null);

  useEffect(() => {
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 86400)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx((prev) => {
        const next = (prev + 1) % insightSlides.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [insightSlides.length]);

  useEffect(() => {
    setSlideIdx(0);
    carouselRef.current?.scrollToIndex({ index: 0, animated: false });
  }, [insightSlides]);

  useEffect(() => {
    if (!suggestedMission) return;
    setActiveMissions((current) => {
      const existingIndex = current.findIndex((mission) => mission.id === 'ai-combo');
      if (existingIndex === -1) return [suggestedMission, ...current];
      const next = [...current];
      next[existingIndex] = suggestedMission;
      return next;
    });
  }, [suggestedMission]);

  useEffect(() => {
    if (hasBooked) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hasBooked]);

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('🔄 Syncing latest customers, missions, and insights...');
    await onRefreshData?.();
    setRefreshing(false);
    showToast('✨ Partner intelligence and Cadence guidance updated.');
  };

  const handleDismissMission = (id: string) => {
    const idx = activeMissions.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const mission = activeMissions[idx];
    const isCompleted = completedMissionIds.includes(mission.id);
    if (isCompleted) {
      showToast('Completed missions cannot be dismissed.');
      return;
    }
    if (fallbackMissions.length === 0) {
      showToast('No alternative fallback missions available.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const [next, ...rest] = fallbackMissions;
    setFallbackMissions([...rest, mission]);
    const updated = [...activeMissions];
    updated[idx] = next;
    setActiveMissions(updated);
    showToast(`Replaced with: "${next.title}"`);
  };

  const handleMissionPress = (mission: MissionItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mission.id === 'ai-combo') onOpenBooking(mission);
    else if (mission.id === 'create-lead') setLeadOpen(true);
    else showToast(`🎯 Action in progress: "${mission.title}"!`);
  };

  const handleLeadSubmit = () => {
    if (!leadName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showToast(`New Lead for "${leadName}" created successfully. Streak protected.`);
    onUpdateCoins(100);
    setLeadOpen(false);
    setLeadName('');
    setLeadPhone('');
  };

  const handleStreakLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Demo Reset', 'Restore all UI to starting state?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: onDemoReset },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || !!dataLoading} onRefresh={handleRefresh} tintColor={colors.brandBlue} />
        }
      >
        <PartnerScreenHeader
          onBack={onBack}
          kicker={`${timeGreeting},`}
          title={agent.name}
          subtitle="Protect your streak with today's missions."
          trailing={
            <Pressable
              onPress={() => showToast('Earn coins by finishing your daily missions to protect your streak!')}
              style={styles.coinPill}
            >
              <CoinInline
                amount={agent.coins}
                suffix="Coins"
                size="sm"
                float
                textStyle={styles.coinText}
              />
            </Pressable>
          }
        >
          <Pressable onLongPress={handleStreakLongPress} delayLongPress={800}>
            <View style={styles.streakRow}>
              <FloatView distance={4} duration={1800}>
                <PulseScale min={1} max={1.12} duration={1200}>
                  <Text style={styles.flame}>🔥</Text>
                </PulseScale>
              </FloatView>
              <Text style={styles.streakNum}>{agent.streak_day}</Text>
              <View>
                <Text style={styles.streakLabel}>DAY</Text>
                <Text style={styles.streakLabel}>STREAK</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardText}>
              You're in the <Text style={styles.heroHighlight}>top {agent.top_percent}%</Text> of active streaks on PBPartners. One booking today keeps it alive.
            </Text>
          </View>

          <View style={styles.rail}>
            <View style={styles.railLine} />
            <View style={styles.railNodes}>
              {MILESTONES.map((m) => {
                const node = (
                  <View style={[styles.nodeCircle, m.done && styles.nodeDone, m.current && styles.nodeCurrent, m.locked && styles.nodeLocked]}>
                    {m.done ? (
                      <Text style={styles.check}>✓</Text>
                    ) : m.locked ? (
                      <Text style={styles.lockIcon}>🔒</Text>
                    ) : (
                      <Text style={styles.nodeCurrentText}>{agent.streak_day}</Text>
                    )}
                  </View>
                );
                return (
                  <View key={m.label} style={styles.railNode}>
                    {m.current ? (
                      <PulseScale min={1} max={1.1} duration={1400}>
                        {node}
                      </PulseScale>
                    ) : (
                      node
                    )}
                    <Text style={[styles.nodeLabel, m.current && styles.nodeLabelCurrent]}>{m.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </PartnerScreenHeader>

        <View style={styles.body}>
          <LinearGradient colors={[colors.royalDeep, colors.royalMid, colors.royalDark]} style={styles.eventCard}>
            <ShimmerBand />
            <View style={styles.exclusiveBanner}>
              <Text style={styles.exclusiveBannerText}>Exclusive for you</Text>
            </View>
            <View style={styles.eventTop}>
              <View style={styles.eventChip}>
                <LiveDot color="#FDE68A" size={6} style={styles.eventLiveDot} />
                <Text style={styles.eventChipText}>2× COINS EVENT</Text>
              </View>
              <PulseScale min={1} max={1.04} duration={1000}>
                <Text style={styles.eventTimer}>{formatCountdown(timer)}</Text>
              </PulseScale>
            </View>
            <Text style={styles.eventTitle}>Book today, earn double</Text>
            <Text style={styles.eventSub}>
              Complete a booking before the timer ends — extra coins land the moment the booking confirms.
            </Text>
          </LinearGradient>

          <View style={[styles.aiCard, shadows.card]}>
            <FlatList
              ref={carouselRef}
              data={insightSlides}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
                setSlideIdx(idx);
              }}
              renderItem={({ item }) => (
                <View style={[styles.slide, { width: SLIDE_W }]}>
                  <View style={styles.aiHeader}>
                    <PulseScale min={1} max={1.12} duration={1800}>
                      <View style={styles.aiBadge}>
                        <Text style={[styles.aiBadgeText, item.icon && styles.aiBadgeIcon]}>
                          {item.icon ?? 'AI'}
                        </Text>
                      </View>
                    </PulseScale>
                    <View style={styles.aiTitleWrap}>
                      <Text style={styles.aiLabel}>{dataLoading ? 'Syncing insight' : 'Proactive Insight'}</Text>
                      <Text style={styles.aiTitle} numberOfLines={2}>{item.title}</Text>
                    </View>
                    <View style={styles.aiTag}><Text style={styles.aiTagText}>{item.badge}</Text></View>
                  </View>
                  <Text style={styles.aiBody} numberOfLines={3}>{item.text}</Text>
                </View>
              )}
            />
            <View style={styles.carouselFooter}>
              {insightSlides.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setSlideIdx(i);
                    carouselRef.current?.scrollToIndex({ index: i, animated: true });
                  }}
                  style={styles.dotPress}
                >
                  <CarouselDot
                    active={slideIdx === i}
                    activeColor={colors.partner.accent}
                    inactiveColor="#CBD5E1"
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.missionSection}>
            <View style={styles.missionSectionHeader}>
              <View style={styles.missionSectionCopy}>
                <View style={styles.missionTitleLine}>
                  <Text style={styles.sectionTitle}>Missions for you</Text>
                  <View style={styles.missionCountPill}>
                    <LiveDot color={colors.partner.accent} size={5} />
                    <Text style={styles.missionCountText}>{activeMissions.length} active</Text>
                  </View>
                </View>
                <Text style={styles.missionSectionSub}>Swipe sideways to swap · tap to start</Text>
              </View>
            </View>
            {activeMissions.map((m, i) => (
              <SwipeableMission
                key={m.id}
                mission={m}
                index={i}
                completed={completedMissionIds.includes(m.id)}
                onPress={() => handleMissionPress(m)}
                onDismiss={() => handleDismissMission(m.id)}
              />
            ))}
          </View>

          <RewardsDesk
            coins={agent.coins}
            streakDay={agent.streak_day}
            hasBooked={hasBooked}
            onUpdateCoins={onUpdateCoins}
            onSelectBadge={setBadgeModal}
            onToast={showToast}
          />
        </View>
      </ScrollView>

      <Toast message={toast} onHide={dismissToast} />

      <Modal visible={leadOpen} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Create Client Lead</Text>
                <Text style={styles.sheetSub}>Locks your streak securely with a valid registry</Text>
              </View>
              <Pressable onPress={() => setLeadOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Client Name</Text>
            <TextInput
              value={leadName}
              onChangeText={setLeadName}
              placeholder="Enter full name (e.g., Suresh Kumar)"
              style={styles.input}
              placeholderTextColor={colors.text.tertiary}
              accessibilityLabel="Client name"
            />
            <Text style={styles.inputLabel}>Contact Phone (Optional)</Text>
            <TextInput
              value={leadPhone}
              onChangeText={setLeadPhone}
              placeholder="Enter 10-digit mobile number"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor={colors.text.tertiary}
              accessibilityLabel="Contact phone"
            />
            <Button label="Add Lead & Unlock (+100 Coins)" onPress={handleLeadSubmit} />
          </View>
        </View>
      </Modal>

      <Modal visible={!!badgeModal} animationType="fade">
        <View style={styles.badgeOverlay}>
          <Pressable onPress={() => setBadgeModal(null)} style={styles.badgeClose}>
            <Text style={styles.badgeCloseText}>✕</Text>
          </Pressable>
          <View style={styles.badgeContent}>
            <View style={styles.pbpChip}>
              <Text style={styles.pbpText}>PBPartners</Text>
            </View>
            <Text style={styles.congrats}>Congratulations!</Text>
            <Text style={styles.congratsSub}>You have earned a milestone badge.</Text>
            <View style={styles.badgeShield}>
              <Text style={styles.badgeEmoji}>{badgeModal?.emoji}</Text>
            </View>
            <Text style={styles.badgeName}>{badgeModal?.name}</Text>
            <Text style={styles.badgeDesc}>{badgeModal?.description}</Text>
            <View style={styles.milestoneChip}>
              <Text style={styles.milestoneText}>🔥 {badgeModal?.day} Milestone</Text>
            </View>
          </View>
          <Button
            label="Share Pride Badges"
            onPress={() => { showToast('📤 Milestone achievement shared on WhatsApp feed!'); setBadgeModal(null); }}
            style={styles.shareBtnWrap}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.canvas },
  scroll: { flex: 1 },
  content: { paddingBottom: space[11] },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: space[2],
    paddingVertical: 6,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  coinText: { fontFamily: fonts.headingExtra, fontSize: typeScale.label.fontSize, color: colors.goldLight },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: space[3], marginBottom: space[2] },
  flame: { fontSize: 32 },
  streakNum: { fontFamily: fonts.headingExtra, fontSize: 42, color: colors.text.inverse, letterSpacing: -1 },
  streakLabel: { ...typeScale.label, color: colors.text.inverseMuted, fontSize: 10 },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    padding: space[2],
    marginBottom: space[2],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroCardText: { ...typeScale.bodySm, color: 'rgba(255,255,255,0.92)' },
  heroHighlight: { fontFamily: fonts.bodyBold, color: colors.goldLight },
  rail: { marginTop: space[1], paddingHorizontal: space[1] },
  railLine: {
    position: 'absolute',
    top: 16,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1,
  },
  railNodes: { flexDirection: 'row', justifyContent: 'space-between' },
  railNode: { alignItems: 'center', gap: space[2] },
  nodeCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { backgroundColor: colors.white },
  nodeCurrent: {
    backgroundColor: '#FECC87',
    borderWidth: 2,
    borderColor: colors.white,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  nodeLocked: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  check: { color: colors.status.success, fontWeight: '800', fontSize: 14 },
  lockIcon: { fontSize: 11 },
  nodeCurrentText: { fontFamily: fonts.headingExtra, fontSize: 11, color: '#552705' },
  nodeLabel: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.text.inverseMuted },
  nodeLabelCurrent: { color: colors.text.inverse, fontFamily: fonts.headingExtra },
  body: { padding: space[4], gap: space[4] },
  eventCard: {
    borderRadius: radius.lg,
    padding: space[4],
    paddingTop: space[5],
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    overflow: 'hidden',
  },
  exclusiveBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FDE68A',
    paddingHorizontal: space[3],
    paddingVertical: 5,
    borderBottomRightRadius: radius.md,
    zIndex: 1,
  },
  exclusiveBannerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#78350F',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  eventLiveDot: { marginRight: space[1] },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[2], marginTop: space[1] },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  eventChipText: { ...typeScale.label, color: colors.text.inverse, fontSize: 10 },
  eventTimer: {
    fontFamily: fonts.headingExtra,
    fontSize: typeScale.bodySm.fontSize,
    color: '#BFDBFE',
    backgroundColor: 'rgba(30,58,138,0.35)',
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  eventTitle: { fontFamily: fonts.headingExtra, fontSize: typeScale.body.fontSize, color: colors.text.inverse, marginTop: space[1] },
  eventSub: { ...typeScale.bodySm, color: 'rgba(191,219,254,0.9)', marginTop: space[1] },
  aiCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    paddingHorizontal: space[3],
    paddingTop: space[3],
    paddingBottom: space[2],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  slide: { paddingRight: 0 },
  aiHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2], marginBottom: space[2] },
  aiBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.partner.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: { color: colors.text.inverse, fontSize: 10, fontFamily: fonts.headingExtra },
  aiBadgeIcon: { fontSize: 14 },
  aiTitleWrap: { flex: 1 },
  aiLabel: { ...typeScale.label, color: colors.partner.accent },
  aiTitle: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary, marginTop: 2 },
  aiTag: {
    backgroundColor: colors.partner.accentSoft,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  aiTagText: { ...typeScale.label, color: colors.partner.accent, fontSize: 10 },
  aiBody: { ...typeScale.bodySm, color: colors.text.secondary, minHeight: 52, lineHeight: 18 },
  carouselFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[2],
    paddingTop: space[2],
  },
  dotPress: { paddingVertical: space[1] },
  sectionTitle: { ...typeScale.heading, color: colors.text.primary },
  missionSection: { gap: space[3] },
  missionSectionHeader: { marginBottom: space[1] },
  missionSectionCopy: { gap: space[1] },
  missionTitleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space[2] },
  missionCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    backgroundColor: colors.partner.accentSoft,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  missionCountText: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.partner.accent },
  missionSectionSub: { ...typeScale.caption, color: colors.text.tertiary },
  missionSwipeWrap: { position: 'relative', marginBottom: space[1] },
  dismissHint: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space[4],
    opacity: 0.35,
  },
  dismissText: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.status.error },
  missionCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: space[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    position: 'relative',
  },
  missionSuggested: { backgroundColor: colors.partner.accentSoft },
  missionDone: { backgroundColor: colors.status.successSoft },
  missionAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.partner.accent,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  missionAccentDone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.status.success,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  suggestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    alignSelf: 'flex-start',
    marginBottom: space[2],
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: space[2],
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestedText: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.caption.fontSize,
    color: colors.partner.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  missionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  missionIconAi: { backgroundColor: colors.partner.accentSoft, borderColor: '#BFDBFE' },
  missionIconText: { fontSize: 20 },
  missionInfo: { flex: 1 },
  missionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  missionTitle: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary },
  doneChip: {
    fontFamily: fonts.headingExtra,
    fontSize: 10,
    color: '#065F46',
    backgroundColor: colors.status.successSoft,
    paddingHorizontal: space[1],
    borderRadius: radius.sm,
  },
  missionDesc: { ...typeScale.caption, color: colors.text.secondary, marginTop: 2 },
  missionCoins: { alignItems: 'flex-end' },
  coinAmtRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinAmt: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.partner.accent },
  coinAmtHighlight: { color: colors.royalDeep, fontSize: typeScale.body.fontSize },
  coinLbl: { ...typeScale.label, color: colors.text.tertiary, fontSize: 9, marginTop: 2 },
  doneCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: { color: colors.text.inverse, fontSize: 12, fontWeight: '800' },
  sheetOverlay: { flex: 1, backgroundColor: colors.surface.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space[6],
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: space[5],
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space[4] },
  sheetTitle: { ...typeScale.heading, color: colors.text.primary },
  sheetSub: { ...typeScale.bodySm, color: colors.text.secondary, marginTop: space[1] },
  closeBtn: {
    width: touch.min,
    height: touch.min,
    borderRadius: touch.min / 2,
    backgroundColor: colors.surface.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.text.secondary, fontSize: 16 },
  inputLabel: { ...typeScale.label, color: colors.text.tertiary, marginBottom: space[2] },
  input: {
    backgroundColor: colors.surface.canvas,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    minHeight: touch.min,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.primary,
    marginBottom: space[3],
  },
  badgeOverlay: { flex: 1, backgroundColor: colors.surface.canvas, padding: space[6], justifyContent: 'space-between' },
  badgeClose: {
    alignSelf: 'flex-end',
    width: touch.min,
    height: touch.min,
    borderRadius: touch.min / 2,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  badgeCloseText: { fontSize: 18, color: colors.text.primary },
  badgeContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  pbpChip: {
    backgroundColor: colors.partner.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: space[5],
  },
  pbpText: { ...typeScale.label, color: colors.partner.accent },
  congrats: { ...typeScale.title, color: colors.text.primary },
  congratsSub: { ...typeScale.bodySm, color: colors.text.secondary, marginTop: space[2], marginBottom: space[6] },
  badgeShield: {
    width: 160,
    height: 170,
    borderRadius: radius.xl,
    backgroundColor: colors.partner.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: space[5],
  },
  badgeEmoji: { fontSize: 56 },
  badgeName: { fontFamily: fonts.headingExtra, fontSize: typeScale.body.fontSize, color: colors.text.primary },
  badgeDesc: { ...typeScale.bodySm, color: colors.text.secondary, textAlign: 'center', marginTop: space[2], paddingHorizontal: space[4] },
  milestoneChip: {
    backgroundColor: colors.status.warningSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space[5],
    paddingVertical: space[2],
    marginTop: space[4],
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  milestoneText: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: '#92400E' },
  shareBtnWrap: { marginTop: space[2] },
});
