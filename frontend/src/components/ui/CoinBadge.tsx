import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius } from '../../theme';
import CoinIcon from './CoinIcon';

type Size = 'sm' | 'md' | 'lg' | 'hero';

interface Props {
  amount: number;
  size?: Size;
  showLabel?: boolean;
  multiplier?: string;
  style?: ViewStyle;
}

const SIZES = {
  sm: { coin: 22, font: 13, padH: 10, padV: 6, label: 9 },
  md: { coin: 28, font: 16, padH: 14, padV: 8, label: 10 },
  lg: { coin: 34, font: 20, padH: 16, padV: 10, label: 11 },
  hero: { coin: 40, font: 24, padH: 18, padV: 12, label: 12 },
};

export default function CoinBadge({
  amount,
  size = 'md',
  showLabel = true,
  multiplier,
  style,
}: Props) {
  const s = SIZES[size];

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[colors.goldDark, colors.gold, colors.goldLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.pill,
          { paddingHorizontal: s.padH, paddingVertical: s.padV },
        ]}
      >
        <CoinIcon size={s.coin} float />
        <View>
          <Text style={[styles.amount, { fontSize: s.font }]}>
            {amount.toLocaleString()}
            {multiplier ? (
              <Text style={styles.mult}> · {multiplier}</Text>
            ) : null}
          </Text>
          {showLabel && (
            <Text style={[styles.coinLabel, { fontSize: s.label }]}>COINS</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  amount: {
    fontFamily: fonts.headingExtra,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mult: { fontFamily: fonts.bodyBold, fontSize: 14 },
  coinLabel: {
    fontFamily: fonts.headingExtra,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
    marginTop: 1,
  },
});
