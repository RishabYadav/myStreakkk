import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, space, type as typeScale } from '../../theme';
import { BreatheView } from '../ui/motion';

interface Props {
  onBack: () => void;
  kicker?: string;
  title?: string;
  subtitle?: string;
  center?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}

export default function PartnerScreenHeader({
  onBack,
  kicker,
  title,
  subtitle,
  center,
  trailing,
  children,
  compact,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={[...colors.partner.hero]} style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact ? <BreatheView style={styles.glow} duration={3200} min={0.25} max={0.85} /> : null}

      <View style={[styles.topRow, compact && styles.topRowCompact, { paddingTop: insets.top + space[1] }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to role selection"
        >
          <Feather name="chevron-left" size={24} color="rgba(255,255,255,0.92)" />
        </Pressable>

        {center ? <View style={styles.center}>{center}</View> : <View style={styles.flex} />}

        {trailing ?? <View style={styles.trailingSpacer} />}
      </View>

      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space[5],
    paddingBottom: space[6],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  wrapCompact: {
    paddingBottom: space[5],
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[3],
    gap: space[2],
  },
  topRowCompact: {
    marginBottom: space[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -space[1],
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  flex: { flex: 1 },
  trailingSpacer: { width: 36 },
  kicker: {
    ...typeScale.label,
    color: colors.text.inverseMuted,
    marginBottom: space[2],
  },
  title: {
    ...typeScale.title,
    color: colors.text.inverse,
  },
  subtitle: {
    ...typeScale.bodySm,
    color: colors.text.inverseMuted,
    marginTop: space[2],
    maxWidth: 340,
  },
});
