import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as Haptics from 'expo-haptics';

import { colors, fonts, space, radius, type as typeScale } from './src/theme';
import { AppLoadingSkeleton } from './src/components/ui/Skeleton';
import { AgentState, Customer, TabId } from './src/types';
import {
  INITIAL_AGENT,
  INITIAL_CUSTOMERS,
  SCORE_AFTER_BOOKING,
  SCORE_AFTER_QUESTIONNAIRE,
  getBookingBreakdown,
  getEnrichedBreakdown,
} from './src/mockData';
import { postDemoReset, postEvent } from './src/services/api';
import { fetchCustomersRanked, fetchCustomerFullProfile, reportCoverageEvent } from './src/services/customerApi';

import BottomNav from './src/components/BottomNav';
import BookingSheet from './src/components/BookingSheet';
import QuestionnaireSheet from './src/components/QuestionnaireSheet';
import StreakHome from './src/screens/StreakHome';
import MyCustomers from './src/screens/MyCustomers';
import CustomerFile from './src/screens/CustomerFile';
import ExpansionGlimpse from './src/screens/ExpansionGlimpse';
import Profile from './src/screens/Profile';

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

  const [agent, setAgent] = useState<AgentState>({ ...INITIAL_AGENT });
  const [customers, setCustomers] = useState<Customer[]>(cloneCustomers(INITIAL_CUSTOMERS));
  const [activeTab, setActiveTab] = useState<TabId>('streak');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showExpansion, setShowExpansion] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [topOpportunityId, setTopOpportunityId] = useState<string | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [hasBooked, setHasBooked] = useState(false);
  const [hasEnriched, setHasEnriched] = useState(false);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [customerProfileData, setCustomerProfileData] = useState<{
    talking_points?: string[];
    lesson_recommendations?: { priority: boolean; icon: string; title: string; body: string }[];
  }>({});

  // Fetch real customer data from backend on mount
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      setCustomersLoading(true);
      const result = await fetchCustomersRanked();
      if (result && result.customers.length > 0) {
        setCustomers(result.customers);
        setTopOpportunityId(result.topOpportunity);
        setIsLiveData(true);
        console.log(`✅ Loaded ${result.customers.length} customers from API`);
      } else {
        console.log('⚠️ API unavailable — using mock data');
      }
      setCustomersLoading(false);
    })();
  }, []);

  const anjali = customers.find((c) => c.customer_id === ANJALI_ID) ?? customers[0];
  const targetId = getTargetCustomerId(isLiveData, topOpportunityId);

  // Fetch full profile data when a customer is selected
  useEffect(() => {
    if (!selectedCustomerId || !isLiveData) {
      setCustomerProfileData({});
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      const profile = await fetchCustomerFullProfile(selectedCustomerId);
      if (cancelled) return;
      if (profile) {
        // Update the customer in the list with fresh data
        setCustomers((prev) =>
          prev.map((c) =>
            c.customer_id === selectedCustomerId
              ? { ...c, ...profile.customer, avatarColors: c.avatarColors }
              : c
          )
        );
        setCustomerProfileData({
          talking_points: profile.talking_points,
          lesson_recommendations: profile.lesson_recommendations,
        });
      }
      setProfileLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedCustomerId, isLiveData]);

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

  const handleOpenBooking = () => setBookingSheetOpen(true);

  const handleConfirmBooking = async () => {
    setBookingSheetOpen(false);
    await postEvent('BOOKING_EVENT');

    setHasBooked(true);
    setAgent((a) => ({ ...a, coins: a.coins + 500 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Report to backend if we're using live data
    if (isLiveData) {
      const topCustomer = customers[0]; // top opportunity
      await reportCoverageEvent(topCustomer.customer_id, 'health', 'sold_by_agent');
      // Refresh customer list from API to get updated scores
      const result = await fetchCustomersRanked();
      if (result) {
        setCustomers(result.customers);
        setTopOpportunityId(result.topOpportunity);
      }
    } else {
      updateAnjali({
        protection_intelligence_score: SCORE_AFTER_BOOKING,
        score_breakdown: getBookingBreakdown(
          INITIAL_CUSTOMERS[0].score_breakdown.map((r) => ({ ...r }))
        ),
        coverage: INITIAL_CUSTOMERS[0].coverage.map((row) =>
          row.id === 'health' ? { ...row, covered: true, source: 'sold_by_agent' } : { ...row }
        ),
      });
    }

    setSelectedCustomerId(targetId);
    setActiveTab('customers');
  };

  const handleQuestionnaireSubmit = async (termYes: boolean) => {
    setQuestionnaireOpen(false);
    if (!termYes) return;

    await postEvent('QUESTIONNAIRE_EVENT');
    setHasEnriched(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isLiveData) {
      const topCustomer = customers[0];
      await reportCoverageEvent(topCustomer.customer_id, 'term', 'added_by_agent');
      // Refresh customer list from API
      const result = await fetchCustomersRanked();
      if (result) {
        setCustomers(result.customers);
        setTopOpportunityId(result.topOpportunity);
      }
    } else {
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
    setSelectedCustomerId(null);
    setShowExpansion(false);
    setBookingSheetOpen(false);
    setQuestionnaireOpen(false);
    setActiveTab('streak');
    setIsOffline(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Try to re-fetch from API (data may have been reset on backend too)
    const result = await fetchCustomersRanked();
    if (result && result.customers.length > 0) {
      setCustomers(result.customers);
      setTopOpportunityId(result.topOpportunity);
      setIsLiveData(true);
    } else {
      setCustomers(cloneCustomers(INITIAL_CUSTOMERS));
      setIsLiveData(false);
    }
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === 'streak') {
      setActiveTab('streak');
    } else {
      setActiveTab(tab);
    }
    if (tab !== 'customers') setSelectedCustomerId(null);
    setShowExpansion(false);
  };

  const handleViewChange = (mode: 'streak' | 'customer_pov') => {
    setActiveTab(mode);
    setSelectedCustomerId(null);
    setShowExpansion(false);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <AppLoadingSkeleton />
      </View>
    );
  }

  const statusBarStyle =
    selectedCustomerId || activeTab === 'profile' ? 'dark' : 'light';

  const hideNav = Boolean(selectedCustomerId) || showExpansion;

  const renderMain = () => {
    if (showExpansion) {
      return (
        <ExpansionGlimpse
          customer={getCustomer(selectedCustomerId)}
          hasBooked={hasBooked && getCustomer(selectedCustomerId).customer_id === targetId}
          hasEnriched={hasEnriched && getCustomer(selectedCustomerId).customer_id === targetId}
          viewMode="customer_pov"
          fabBottomOffset={18}
          onChangeView={(mode) => {
            setShowExpansion(false);
            if (mode === 'streak') setActiveTab('streak');
          }}
        />
      );
    }

    if (selectedCustomerId) {
      return (
        <CustomerFile
          customer={getCustomer(selectedCustomerId)}
          hasBooked={hasBooked && selectedCustomerId === targetId}
          hasEnriched={hasEnriched && selectedCustomerId === targetId}
          onBack={() => setSelectedCustomerId(null)}
          onOpenQuestionnaire={() => setQuestionnaireOpen(true)}
          onOpenExpansion={() => setShowExpansion(true)}
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
            viewMode="streak"
            onChangeView={handleViewChange}
            onOpenBooking={handleOpenBooking}
            onUpdateCoins={handleUpdateCoins}
            onDemoReset={handleDemoReset}
          />
        );
      case 'customer_pov':
        return (
          <ExpansionGlimpse
            customer={anjali}
            hasBooked={hasBooked}
            hasEnriched={hasEnriched}
            viewMode="customer_pov"
            onChangeView={handleViewChange}
          />
        );
      case 'customers':
        return (
          <MyCustomers
            customers={customers}
            topOpportunityId={topOpportunityId}
            loading={customersLoading}
            onOpenCustomer={(id) => setSelectedCustomerId(id)}
          />
        );
      case 'profile':
        return (
          <Profile
            agent={agent}
            isOffline={isOffline}
            onToggleOffline={() => setIsOffline((v) => !v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar style={statusBarStyle} />
        {isOffline && (
          <View style={styles.offlineBar}>
            <View style={styles.offlineLeft}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Offline Mode · Real-time sync pending</Text>
            </View>
            <Pressable onPress={() => setIsOffline(false)} style={styles.offlineBtn}>
              <Text style={styles.offlineBtnText}>Back Online</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.app}>{renderMain()}</View>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} visible={!hideNav} />
        <BookingSheet
          visible={bookingSheetOpen}
          onClose={() => setBookingSheetOpen(false)}
          onConfirm={handleConfirmBooking}
        />
        <QuestionnaireSheet
          visible={questionnaireOpen}
          onClose={() => setQuestionnaireOpen(false)}
          onSubmit={handleQuestionnaireSubmit}
        />
      </SafeAreaView>
    </SafeAreaProvider>
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
