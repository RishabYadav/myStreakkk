import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, space } from '../theme';
import { customerTheme } from '../theme/customerTheme';

export type FlowNavVariant = 'partner-hero' | 'partner-light' | 'customer-light';

interface Props {
  variant: FlowNavVariant;
  onBack: () => void;
  badge?: string;
}

export function flowNavStatusBar(variant: FlowNavVariant): 'light' | 'dark' {
  return variant === 'partner-hero' ? 'light' : 'dark';
}

export default function FlowNavBar({ variant, onBack, badge }: Props) {
  const insets = useSafeAreaInsets();
  const isLight = variant === 'partner-light' || variant === 'customer-light';
  const isCustomer = variant === 'customer-light';
  const tint = isLight ? colors.text.primary : '#FFFFFF';
  const chevronColor = isLight ? customerTheme.accent : 'rgba(255,255,255,0.92)';

  const row = (
    <View style={[styles.row, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Back to role selection"
      >
        <Feather name="chevron-left" size={22} color={chevronColor} style={styles.chevron} />
        <Text style={[styles.backLabel, { color: tint }]}>Cadence</Text>
      </Pressable>
      {badge ? (
        <View
          style={[
            styles.badge,
            isLight && styles.badgeLight,
            isCustomer && styles.badgeCustomer,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isLight && styles.badgeTextLight,
              isCustomer && styles.badgeTextCustomer,
            ]}
          >
            {badge}
          </Text>
        </View>
      ) : (
        <View style={styles.badgeSpacer} />
      )}
    </View>
  );

  if (isLight) {
    return (
      <View style={[styles.lightWrap, isCustomer && styles.customerLightWrap]}>
        {row}
        <View style={[styles.lightHairline, isCustomer && styles.customerLightHairline]} />
      </View>
    );
  }

  return (
    <LinearGradient colors={[...colors.partner.hero]} style={styles.heroWrap}>
      {row}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroWrap: {},
  lightWrap: {
    backgroundColor: '#FFFFFF',
  },
  customerLightWrap: {
    backgroundColor: customerTheme.nav[0],
  },
  lightHairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  customerLightHairline: {
    backgroundColor: customerTheme.accentBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[3],
    paddingBottom: space[2],
    minHeight: 44,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: space[3],
  },
  backPressed: { opacity: 0.65 },
  chevron: { marginLeft: -6 },
  backLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  badgeLight: {
    backgroundColor: colors.partner.accentSoft,
    borderColor: 'rgba(37,99,235,0.15)',
  },
  badgeCustomer: {
    backgroundColor: customerTheme.accentSoft,
    borderColor: customerTheme.accentBorder,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  badgeTextLight: {
    color: colors.partner.accent,
  },
  badgeTextCustomer: {
    color: customerTheme.accentDark,
  },
  badgeSpacer: { width: 64 },
});
