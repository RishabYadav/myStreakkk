import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, space, type as typeScale, touch } from '../theme';
import { TabId } from '../types';
import { PulseScale } from './ui/motion';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  visible?: boolean;
}

const TABS: { id: TabId; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'streak', label: 'Streak', icon: 'zap' },
  { id: 'grow', label: 'Grow', icon: 'trending-up' },
  { id: 'customers', label: 'Customers', icon: 'users' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export default function BottomNav({ activeTab, onTabChange, visible = true }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const isStreakActive = activeTab === 'streak';

  return (
    <View style={[styles.wrap, shadows.nav, { paddingBottom: Math.max(insets.bottom, space[2]) }]}>
      {TABS.map((tab) => {
        const active = tab.id === 'streak' ? isStreakActive : activeTab === tab.id;
        const isGrow = tab.id === 'grow';
        return (
          <Pressable
            key={tab.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTabChange(tab.id === 'streak' ? 'streak' : tab.id);
            }}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            {active && <View style={[styles.topIndicator, isGrow && styles.topIndicatorGrow]} />}
            {active && (tab.id === 'streak' || isGrow) ? (
              <PulseScale min={1} max={isGrow ? 1.12 : 1.14} duration={1400}>
                <Feather
                  name={tab.icon}
                  size={22}
                  color={isGrow ? colors.customerGreen : colors.partner.accent}
                />
              </PulseScale>
            ) : (
              <Feather
                name={tab.icon}
                size={22}
                color={active ? colors.partner.accent : colors.text.tertiary}
              />
            )}
            <Text style={[styles.label, active && styles.labelActive, active && isGrow && styles.labelActiveGrow]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: space[2],
    paddingHorizontal: space[2],
    minHeight: 56,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touch.min,
    paddingVertical: space[1],
    position: 'relative',
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.partner.accent,
  },
  topIndicatorGrow: {
    backgroundColor: colors.customerGreen,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: typeScale.label.fontSize,
    color: colors.text.tertiary,
    marginTop: space[1],
  },
  labelActive: {
    fontFamily: fonts.bodyBold,
    color: colors.partner.accent,
  },
  labelActiveGrow: {
    color: colors.customerGreen,
  },
});
