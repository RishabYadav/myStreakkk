import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
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
import { AgentState, Customer, TabId, AppFlow, CustomerTabId } from './src/types';
import {
  INITIAL_AGENT,
  INITIAL_CUSTOMERS,
  SCORE_AFTER_BOOKING,
  SCORE_AFTER_QUESTIONNAIRE,
  getBookingBreakdown,
  getEnrichedBreakdown,
} from './src/mockData';
import { postDemoReset, postEvent } from './src/services/api';

import BottomNav from './src/components/BottomNav';
import CustomerBottomNav from './src/components/CustomerBottomNav';
import BookingSheet from './src/components/BookingSheet';
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

  const [hasBooked, setHasBooked] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);

  const anjali = customers.find((c) => c.customer_id === ANJALI_ID) ?? customers[0];

  const getCustomer = (id: string | null) =>
    customers.find((c) => c.customer_id === (id ?? ANJALI_ID)) ?? customers[0];

  const updateAnjali = useCallback((patch: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.customer_id === ANJALI_ID ? { ...c, ...patch } : c))
    );
  }, []);

  const handleUpdateCoins = useCallback((amount: number) => {
    setAgent((a) => ({ ...a, coins: a.coins + amount }));
  }, []);

  const handleOpenBooking = () => setBookingSheetOpen(true);

  const handleConfirmBooking = async () => {
    setBookingSheetOpen(false);
    await postEvent('BOOKING_EVENT');

    setHasBooked(true);
    setAgent((a) => ({ ...a, coins: a.coins + 500 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    updateAnjali({
      protection_intelligence_score: SCORE_AFTER_BOOKING,
      score_breakdown: getBookingBreakdown(
        INITIAL_CUSTOMERS[0].score_breakdown.map((r) => ({ ...r }))
      ),
      coverage: INITIAL_CUSTOMERS[0].coverage.map((row) =>
        row.id === 'health' ? { ...row, covered: true, source: 'sold_by_agent' } : { ...row }
      ),
    });

    setSelectedCustomerId(ANJALI_ID);
    setActiveTab('customers');
  };

  const handleQuestionnaireSubmit = async (termYes: boolean) => {
    setQuestionnaireOpen(false);
    if (!termYes) return;

    await postEvent('QUESTIONNAIRE_EVENT');
    setHasEnriched(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
  };

  const handleDemoReset = async () => {
    await postDemoReset();
    setAgent({ ...INITIAL_AGENT });
    setCustomers(cloneCustomers(INITIAL_CUSTOMERS));
    setHasBooked(false);
    setHasEnriched(false);
    setSelectedCustomerId(null);
    setShowExpansion(false);
    setBookingSheetOpen(false);
    setQuestionnaireOpen(false);
    setActiveTab('streak');
    setCustomerTab('home');
    setAppFlow('entry');
    setIsOffline(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        hasEnriched={hasEnriched}
        bookingSheetOpen={bookingSheetOpen}
        questionnaireOpen={questionnaireOpen}
        anjali={anjali}
        getCustomer={getCustomer}
        onTabChange={handleTabChange}
        onCustomerTabChange={setCustomerTab}
        onSwitchExperience={handleSwitchExperience}
        onSelectCustomer={setSelectedCustomerId}
        onShowExpansion={setShowExpansion}
        onOpenBooking={handleOpenBooking}
        onUpdateCoins={handleUpdateCoins}
        onToggleOffline={() => setIsOffline((v) => !v)}
        onCloseBooking={() => setBookingSheetOpen(false)}
        onConfirmBooking={handleConfirmBooking}
        onCloseQuestionnaire={() => setQuestionnaireOpen(false)}
        onQuestionnaireSubmit={handleQuestionnaireSubmit}
        onOpenQuestionnaire={() => setQuestionnaireOpen(true)}
        onDemoReset={handleDemoReset}
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
  hasEnriched: boolean;
  bookingSheetOpen: boolean;
  questionnaireOpen: boolean;
  anjali: Customer;
  getCustomer: (id: string | null) => Customer;
  onTabChange: (tab: TabId) => void;
  onCustomerTabChange: (tab: CustomerTabId) => void;
  onSwitchExperience: () => void;
  onSelectCustomer: (id: string | null) => void;
  onShowExpansion: (show: boolean) => void;
  onOpenBooking: () => void;
  onUpdateCoins: (amount: number) => void;
  onToggleOffline: () => void;
  onCloseBooking: () => void;
  onConfirmBooking: () => void;
  onCloseQuestionnaire: () => void;
  onQuestionnaireSubmit: (termYes: boolean) => void;
  onOpenQuestionnaire: () => void;
  onDemoReset: () => void;
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
  hasEnriched,
  bookingSheetOpen,
  questionnaireOpen,
  anjali,
  getCustomer,
  onTabChange,
  onCustomerTabChange,
  onSwitchExperience,
  onSelectCustomer,
  onShowExpansion,
  onOpenBooking,
  onUpdateCoins,
  onToggleOffline,
  onCloseBooking,
  onConfirmBooking,
  onCloseQuestionnaire,
  onQuestionnaireSubmit,
  onOpenQuestionnaire,
  onDemoReset,
}: MainShellProps) {
  const isCustomerFlow = appFlow === 'customer';
  const hideNav = Boolean(selectedCustomerId) || showExpansion;

  const flowNavConfig = ((): { variant: FlowNavVariant; badge: string } | null => {
    if (hideNav) return null;
    if (isCustomerFlow) {
      return { variant: 'customer-light', badge: 'Preview' };
    }
    if (activeTab === 'grow' || activeTab === 'profile') {
      return { variant: 'partner-light', badge: 'Partner' };
    }
    return { variant: 'partner-hero', badge: 'Partner' };
  })();

  const statusBarStyle = flowNavConfig ? flowNavStatusBar(flowNavConfig.variant) : 'dark';

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
          hasBooked={hasBooked && getCustomer(selectedCustomerId).customer_id === ANJALI_ID}
          hasEnriched={hasEnriched && getCustomer(selectedCustomerId).customer_id === ANJALI_ID}
          previewMode
          onBack={() => onShowExpansion(false)}
          fabBottomOffset={18}
        />
      );
    }

    if (selectedCustomerId) {
      return (
        <CustomerFile
          customer={getCustomer(selectedCustomerId)}
          hasBooked={hasBooked && selectedCustomerId === ANJALI_ID}
          hasEnriched={hasEnriched && selectedCustomerId === ANJALI_ID}
          onBack={() => onSelectCustomer(null)}
          onOpenQuestionnaire={onOpenQuestionnaire}
          onOpenExpansion={() => onShowExpansion(true)}
        />
      );
    }

    switch (activeTab) {
      case 'streak':
        return (
          <StreakHome
            agent={agent}
            hasBooked={hasBooked}
            onOpenBooking={onOpenBooking}
            onUpdateCoins={onUpdateCoins}
            onDemoReset={onDemoReset}
          />
        );
      case 'grow':
        return <GrowScreen customers={customers} streakDay={agent.streak_day} />;
      case 'customers':
        return (
          <MyCustomers customers={customers} onOpenCustomer={(id) => onSelectCustomer(id)} />
        );
      case 'profile':
        return (
          <Profile
            agent={agent}
            isOffline={isOffline}
            onToggleOffline={onToggleOffline}
            onSwitchExperience={onSwitchExperience}
          />
        );
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
      <BookingSheet visible={bookingSheetOpen} onClose={onCloseBooking} onConfirm={onConfirmBooking} />
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
