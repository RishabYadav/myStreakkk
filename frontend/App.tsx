import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Alert, Linking, View, StyleSheet, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as Haptics from 'expo-haptics';

import { colors, fonts, space, radius, type as typeScale } from './src/theme';
import { AppLoadingSkeleton } from './src/components/ui/Skeleton';
import { AgentState, AiSlide, Customer, TabId, AppFlow, CustomerTabId, MissionItem } from './src/types';
import {
  CADENCE_AI,
  INITIAL_AGENT,
  INITIAL_CUSTOMERS,
  SCORE_AFTER_BOOKING,
  SCORE_AFTER_QUESTIONNAIRE,
  getBookingBreakdown,
  getEnrichedBreakdown,
} from './src/mockData';
import { postDemoReset, postEvent } from './src/services/api';
import {
  CadenceData,
  cadenceToInsights,
  cadenceToMission,
  fetchCadence,
  fetchPartnerContact,
  fetchPartnerIntelligence,
} from './src/services/partnerApi';

import BottomNav from './src/components/BottomNav';
import CustomerBottomNav from './src/components/CustomerBottomNav';
import OutreachSheet from './src/components/OutreachSheet';
import QuestionnaireSheet from './src/components/QuestionnaireSheet';
import EntryScreen from './src/screens/EntryScreen';
import StreakHome from './src/screens/StreakHome';
import MyCustomers from './src/screens/MyCustomers';
import CustomerFile from './src/screens/CustomerFile';
import ExpansionGlimpse from './src/screens/ExpansionGlimpse';
import GrowScreen from './src/screens/GrowScreen';
import Profile from './src/screens/Profile';
import CustomerProfile from './src/screens/CustomerProfile';
import FlowNavBar, { FlowNavVariant, flowNavStatusBar } from './src/components/FlowNavBar';

const ANJALI_ID = 'C5501';

// The "target" customer for the demo booking/enrichment flow.
// With live data this becomes the top opportunity UUID from the API.
function getTargetCustomerId(isLive: boolean, topOppId: string | null): string {
  return isLive && topOppId ? topOppId : ANJALI_ID;
}

function cloneCustomers(list: Customer[]): Customer[] {
  return list.map((c) => ({
    ...c,
    score_breakdown: c.score_breakdown.map((r) => ({ ...r })),
    coverage: c.coverage.map((r) => ({ ...r })),
  }));
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_700Bold,
    Sora_800ExtraBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [appFlow, setAppFlow] = useState<AppFlow>('entry');
  const [agent, setAgent] = useState<AgentState>({ ...INITIAL_AGENT });
  const [customers, setCustomers] = useState<Customer[]>(cloneCustomers(INITIAL_CUSTOMERS));
  const [activeTab, setActiveTab] = useState<TabId>('streak');
  const [customerTab, setCustomerTab] = useState<CustomerTabId>('home');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showExpansion, setShowExpansion] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [topOpportunityId, setTopOpportunityId] = useState<string | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [partnerDataLoading, setPartnerDataLoading] = useState(true);
  const [proactiveInsights, setProactiveInsights] = useState<AiSlide[] | null>(null);
  const [suggestedMission, setSuggestedMission] = useState<MissionItem | null>(null);
  const [topCadence, setTopCadence] = useState<CadenceData | null>(null);

  const [hasBooked, setHasBooked] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const [activeOutreachMission, setActiveOutreachMission] = useState<MissionItem | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [contactActionLoading, setContactActionLoading] = useState<'call' | 'whatsapp' | null>(null);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [customerProfileData, setCustomerProfileData] = useState<{
    talking_points?: string[];
    lesson_recommendations?: { priority: boolean; icon: string; title: string; body: string }[];
  }>({});

  const refreshPartnerData = useCallback(async () => {
    setCustomersLoading(true);
    setPartnerDataLoading(true);

    const intelligenceRequest = fetchPartnerIntelligence(agent.partner_id);
    const cadenceRequest = fetchCadence(agent.partner_id);

    const intelligence = await intelligenceRequest;
    if (intelligence?.customers.length) {
      setCustomers(intelligence.customers);
      setTopOpportunityId(intelligence.topOpportunity);
      setIsLiveData(true);
    }
    setCustomersLoading(false);

    const cadence = await cadenceRequest;
    if (cadence) {
      setTopCadence(cadence);
      setProactiveInsights(cadenceToInsights(cadence));
      setSuggestedMission(cadenceToMission(cadence));
    }
    setPartnerDataLoading(false);
  }, [agent.partner_id]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void refreshPartnerData();
  }, [refreshPartnerData]);

  const anjali = customers.find((c) => c.customer_id === ANJALI_ID) ?? customers[0];
  const targetId = getTargetCustomerId(isLiveData, topOpportunityId);

  // Fetch customer-specific Cadence guidance when a customer is selected.
  useEffect(() => {
    if (!selectedCustomerId || !isLiveData) {
      setCustomerProfileData({});
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      const cadence =
        topCadence?.customer_id === selectedCustomerId
          ? topCadence
          : await fetchCadence(agent.partner_id, selectedCustomerId);
      if (cancelled) return;
      if (cadence) {
        setCustomerProfileData({
          talking_points: cadence.talking_points,
          lesson_recommendations: cadence.lesson_recommendations,
        });
      }
      setProfileLoading(false);
    })();
    return () => { cancelled = true; };
  }, [agent.partner_id, selectedCustomerId, isLiveData, topCadence]);

  const getCustomer = (id: string | null) =>
    customers.find((c) => c.customer_id === (id ?? targetId)) ?? customers[0];

  const updateAnjali = useCallback((patch: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.customer_id === targetId ? { ...c, ...patch } : c))
    );
  }, [targetId]);

  const handleUpdateCoins = useCallback((amount: number) => {
    setAgent((a) => ({ ...a, coins: a.coins + amount }));
  }, []);

  const handleOpenBooking = (mission: MissionItem) => {
    setActiveOutreachMission(mission);
    setBookingSheetOpen(true);
  };

  const handleCloseOutreach = () => {
    setBookingSheetOpen(false);
    setActiveOutreachMission(null);
  };

  const handleContactAction = async (mode: 'call' | 'whatsapp') => {
    const customer = getCustomer(targetId);
    setContactActionLoading(mode);
    const contact = await fetchPartnerContact(agent.partner_id, customer.customer_id);

    if (!contact) {
      setContactActionLoading(null);
      Alert.alert('Contact unavailable', `No phone number is available for ${customer.name}.`);
      return;
    }

    const digits = contact.phone.replace(/\D/g, '');
    const internationalDigits = digits.length === 10 ? `91${digits}` : digits;
    const phoneNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    const firstName = contact.name.split(' ')[0];
    const whatsappMessage = topCadence?.whatsapp_message ?? (
      "Hi " + firstName + ",\n\n" + CADENCE_AI.coach_tip +
      "\n\nWould you be available for a quick 10-minute call today to review this together?"
    );

    try {
      if (mode === 'call') {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        await Linking.openURL(
          `https://wa.me/${internationalDigits}?text=${encodeURIComponent(whatsappMessage)}`
        );
      }
      if (activeOutreachMission && !completedMissionIds.includes(activeOutreachMission.id)) {
        setCompletedMissionIds((current) => [...current, activeOutreachMission.id]);
        handleUpdateCoins(activeOutreachMission.coins);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      handleCloseOutreach();
    } catch {
      Alert.alert(
        mode === 'call' ? 'Unable to open dialer' : 'Unable to open WhatsApp',
        'Please check that a compatible calling or WhatsApp application is available.'
      );
    } finally {
      setContactActionLoading(null);
    }
  };
  const handleQuestionnaireSubmit = async (termYes: boolean) => {
    setQuestionnaireOpen(false);
    if (!termYes) return;

    await postEvent('QUESTIONNAIRE_EVENT');
    setHasEnriched(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!isLiveData) {
      updateAnjali({
        protection_intelligence_score: SCORE_AFTER_QUESTIONNAIRE,
        score_breakdown: getEnrichedBreakdown(
          getBookingBreakdown(INITIAL_CUSTOMERS[0].score_breakdown.map((r) => ({ ...r })))
        ),
        coverage: INITIAL_CUSTOMERS[0].coverage.map((row) => {
          if (row.id === 'health') return { ...row, covered: true, source: 'sold_by_agent' as const };
          if (row.id === 'term') return { ...row, covered: true, source: 'added_by_agent' as const };
          return { ...row };
        }),
      });
    }
  };

  const handleDemoReset = async () => {
    await postDemoReset();
    setAgent({ ...INITIAL_AGENT });
    setHasBooked(false);
    setHasEnriched(false);
    setCompletedMissionIds([]);
    setActiveOutreachMission(null);
    setSelectedCustomerId(null);
    setShowExpansion(false);
    setBookingSheetOpen(false);
    setQuestionnaireOpen(false);
    setActiveTab('streak');
    setCustomerTab('home');
    setAppFlow('entry');
    setIsOffline(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await refreshPartnerData();
  };

  const handleSelectFlow = (flow: Exclude<AppFlow, 'entry'>) => {
    setAppFlow(flow);
    if (flow === 'partner') {
      setActiveTab('streak');
    } else {
      setCustomerTab('home');
    }
    setSelectedCustomerId(null);
    setShowExpansion(false);
  };

  const handleSwitchExperience = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppFlow('entry');
    setActiveTab('streak');
    setCustomerTab('home');
    setSelectedCustomerId(null);
    setShowExpansion(false);
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab !== 'customers') setSelectedCustomerId(null);
    setShowExpansion(false);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <AppLoadingSkeleton />
      </View>
    );
  }

  if (appFlow === 'entry') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <EntryScreen onSelectFlow={handleSelectFlow} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <MainShell
        appFlow={appFlow}
        agent={agent}
        customers={customers}
        activeTab={activeTab}
        customerTab={customerTab}
        selectedCustomerId={selectedCustomerId}
        showExpansion={showExpansion}
        isOffline={isOffline}
        hasBooked={hasBooked}
        completedMissionIds={completedMissionIds}
        hasEnriched={hasEnriched}
        questionnaireOpen={questionnaireOpen}
        anjali={anjali}
        targetId={targetId}
        customersLoading={customersLoading}
        profileLoading={profileLoading}
        customerProfileData={customerProfileData}
        topOpportunityId={topOpportunityId}
        proactiveInsights={proactiveInsights}
        suggestedMission={suggestedMission}
        partnerDataLoading={partnerDataLoading}
        getCustomer={getCustomer}
        onTabChange={handleTabChange}
        onCustomerTabChange={setCustomerTab}
        onSwitchExperience={handleSwitchExperience}
        onSelectCustomer={setSelectedCustomerId}
        onShowExpansion={setShowExpansion}
        onOpenBooking={handleOpenBooking}
        onUpdateCoins={handleUpdateCoins}
        onToggleOffline={() => setIsOffline((v) => !v)}
        onCloseQuestionnaire={() => setQuestionnaireOpen(false)}
        onQuestionnaireSubmit={handleQuestionnaireSubmit}
        onOpenQuestionnaire={() => setQuestionnaireOpen(true)}
        onDemoReset={handleDemoReset}
        onRefreshPartnerData={refreshPartnerData}
      />
      <OutreachSheet
        visible={bookingSheetOpen}
        customerName={getCustomer(targetId).name}
        talkingPoints={topCadence?.talking_points ?? CADENCE_AI.talking_points}
        actionLoading={contactActionLoading}
        onClose={handleCloseOutreach}
        onCall={() => void handleContactAction('call')}
        onWhatsApp={() => void handleContactAction('whatsapp')}
      />
    </SafeAreaProvider>
  );
}

interface MainShellProps {
  appFlow: Exclude<AppFlow, 'entry'>;
  agent: AgentState;
  customers: Customer[];
  activeTab: TabId;
  customerTab: CustomerTabId;
  selectedCustomerId: string | null;
  showExpansion: boolean;
  isOffline: boolean;
  hasBooked: boolean;
  completedMissionIds: string[];
  hasEnriched: boolean;
  questionnaireOpen: boolean;
  anjali: Customer;
  targetId: string;
  customersLoading: boolean;
  profileLoading: boolean;
  customerProfileData: {
    talking_points?: string[];
    lesson_recommendations?: { priority: boolean; icon: string; title: string; body: string }[];
  };
  topOpportunityId: string | null;
  proactiveInsights: AiSlide[] | null;
  suggestedMission: MissionItem | null;
  partnerDataLoading: boolean;
  getCustomer: (id: string | null) => Customer;
  onTabChange: (tab: TabId) => void;
  onCustomerTabChange: (tab: CustomerTabId) => void;
  onSwitchExperience: () => void;
  onSelectCustomer: (id: string | null) => void;
  onShowExpansion: (show: boolean) => void;
  onOpenBooking: (mission: MissionItem) => void;
  onUpdateCoins: (amount: number) => void;
  onToggleOffline: () => void;
  onCloseQuestionnaire: () => void;
  onQuestionnaireSubmit: (termYes: boolean) => void;
  onOpenQuestionnaire: () => void;
  onDemoReset: () => void;
  onRefreshPartnerData: () => Promise<void>;
}

function MainShell({
  appFlow,
  agent,
  customers,
  activeTab,
  customerTab,
  selectedCustomerId,
  showExpansion,
  isOffline,
  hasBooked,
  completedMissionIds,
  hasEnriched,
  questionnaireOpen,
  anjali,
  targetId,
  customersLoading,
  profileLoading,
  customerProfileData,
  topOpportunityId,
  proactiveInsights,
  suggestedMission,
  partnerDataLoading,
  getCustomer,
  onTabChange,
  onCustomerTabChange,
  onSwitchExperience,
  onSelectCustomer,
  onShowExpansion,
  onOpenBooking,
  onUpdateCoins,
  onToggleOffline,
  onCloseQuestionnaire,
  onQuestionnaireSubmit,
  onOpenQuestionnaire,
  onDemoReset,
  onRefreshPartnerData,
}: MainShellProps) {
  const isCustomerFlow = appFlow === 'customer';
  const hideNav = Boolean(selectedCustomerId) || showExpansion;

  const flowNavConfig = ((): { variant: FlowNavVariant; badge: string } | null => {
    if (hideNav) return null;
    if (isCustomerFlow) {
      return { variant: 'customer-light', badge: 'Preview' };
    }
    if (activeTab === 'streak') {
      return null;
    }
    if (activeTab === 'grow' || activeTab === 'profile') {
      return { variant: 'partner-light', badge: 'Partner' };
    }
    return { variant: 'partner-light', badge: 'Partner' };
  })();

  const statusBarStyle = flowNavConfig
    ? flowNavStatusBar(flowNavConfig.variant)
    : !isCustomerFlow && activeTab === 'streak'
      ? 'light'
      : 'dark';

  const renderMain = () => {
    if (isCustomerFlow) {
      if (customerTab === 'profile') {
        return <CustomerProfile customer={anjali} />;
      }
      return (
        <ExpansionGlimpse
          customer={anjali}
          hasBooked={hasBooked}
          hasEnriched={hasEnriched}
          fabBottomOffset={18}
        />
      );
    }

    if (showExpansion) {
      return (
        <ExpansionGlimpse
          customer={getCustomer(selectedCustomerId)}
          hasBooked={hasBooked && getCustomer(selectedCustomerId).customer_id === targetId}
          hasEnriched={hasEnriched && getCustomer(selectedCustomerId).customer_id === targetId}
          fabBottomOffset={18}
        />
      );
    }

    if (selectedCustomerId) {
      return (
        <CustomerFile
          customer={getCustomer(selectedCustomerId)}
          hasBooked={hasBooked && selectedCustomerId === targetId}
          hasEnriched={hasEnriched && selectedCustomerId === targetId}
          onBack={() => onSelectCustomer(null)}
          onOpenQuestionnaire={onOpenQuestionnaire}
          talkingPoints={customerProfileData.talking_points}
          lessonRecommendations={customerProfileData.lesson_recommendations}
          loading={profileLoading}
        />
      );
    }

    switch (activeTab) {
      case 'streak':
        return (
          <StreakHome
            agent={agent}
            hasBooked={hasBooked}
            completedMissionIds={completedMissionIds}
            onOpenBooking={onOpenBooking}
            onUpdateCoins={onUpdateCoins}
            onDemoReset={onDemoReset}
            onBack={onSwitchExperience}
            proactiveInsights={proactiveInsights}
            suggestedMission={suggestedMission}
            dataLoading={partnerDataLoading}
            onRefreshData={onRefreshPartnerData}
          />
        );
      case 'grow':
        return <GrowScreen customers={customers} streakDay={agent.streak_day} />;
      case 'customers':
        return (
          <MyCustomers
            customers={customers}
            topOpportunityId={topOpportunityId}
            loading={customersLoading}
            onOpenCustomer={(id) => onSelectCustomer(id)}
          />
        );
      case 'profile':
        return <Profile agent={agent} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={statusBarStyle} />
      {isOffline && (
        <View style={styles.offlineBar}>
          <View style={styles.offlineLeft}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineText}>Offline Mode · Real-time sync pending</Text>
          </View>
          <Pressable onPress={onToggleOffline} style={styles.offlineBtn}>
            <Text style={styles.offlineBtnText}>Back Online</Text>
          </Pressable>
        </View>
      )}
      {flowNavConfig ? (
        <FlowNavBar
          variant={flowNavConfig.variant}
          badge={flowNavConfig.badge}
          onBack={onSwitchExperience}
        />
      ) : null}
      <View style={styles.app}>{renderMain()}</View>
      {isCustomerFlow ? (
        <CustomerBottomNav
          activeTab={customerTab}
          onTabChange={onCustomerTabChange}
          visible={!hideNav}
        />
      ) : (
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} visible={!hideNav} />
      )}
      <QuestionnaireSheet
        visible={questionnaireOpen}
        onClose={onCloseQuestionnaire}
        onSubmit={onQuestionnaireSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.surface.canvas },
  root: { flex: 1, backgroundColor: colors.surface.canvas },
  app: { flex: 1 },
  offlineBar: {
    backgroundColor: colors.status.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    minHeight: 44,
  },
  offlineLeft: { flexDirection: 'row', alignItems: 'center', gap: space[2], flex: 1 },
  offlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.inverse },
  offlineText: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.inverse,
    flexShrink: 1,
  },
  offlineBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: space[3],
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  offlineBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.label.fontSize,
    color: colors.text.inverse,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
