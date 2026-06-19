import React from 'react';
import { View, Text, StyleSheet, TextStyle, StyleProp, ViewStyle } from 'react-native';
import CoinIcon from './CoinIcon';

interface Props {
  amount: number | string;
  suffix?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  float?: boolean;
  format?: boolean;
}

export default function CoinInline({
  amount,
  suffix = 'Coins',
  size = 'sm',
  textStyle,
  style,
  float = false,
  format = false,
}: Props) {
  const value = format && typeof amount === 'number' ? amount.toLocaleString() : amount;

  return (
    <View style={[styles.row, style]}>
      <CoinIcon size={size} float={float} />
      <Text style={textStyle}>
        {value}
        {suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
