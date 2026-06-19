import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, space, type as typeScale, touch } from '../theme';
import { customerTheme } from '../theme/customerTheme';
import { CustomerTabId } from '../types';
import { PulseScale } from './ui/motion';

interface Props {
  activeTab: CustomerTabId;
  onTabChange: (tab: CustomerTabId) => void;
  visible?: boolean;
}

const TABS: { id: CustomerTabId; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'home', label: 'Protection', icon: 'shield' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export default function CustomerBottomNav({ activeTab, onTabChange, visible = true }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View style={[styles.wrap, shadows.nav, { paddingBottom: Math.max(insets.bottom, space[2]) }]}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTabChange(tab.id);
            }}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            {active && <View style={styles.topIndicator} />}
            {active ? (
              <PulseScale min={1} max={1.12} duration={1400}>
                <Feather name={tab.icon} size={22} color={customerTheme.accent} />
              </PulseScale>
            ) : (
              <Feather name={tab.icon} size={22} color={colors.text.tertiary} />
            )}
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
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
    borderTopColor: customerTheme.accentBorder,
    paddingTop: space[2],
    paddingHorizontal: space[6],
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
    backgroundColor: customerTheme.accent,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: typeScale.label.fontSize,
    color: colors.text.tertiary,
    marginTop: space[1],
  },
  labelActive: {
    fontFamily: fonts.bodyBold,
    color: customerTheme.accent,
  },
});
