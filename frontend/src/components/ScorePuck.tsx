import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { puckHex } from '../utils';
import { fonts } from '../theme';

interface Props {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export default function ScorePuck({ score, size = 56, showLabel = false }: Props) {
  const color = puckHex(score);
  const fontSize = Math.round(size * 0.34);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.puck,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
        ]}
      >
        <Text style={[styles.score, { color, fontSize, lineHeight: fontSize + 2 }]}>{score}</Text>
      </View>
      {showLabel ? <Text style={styles.label}>Score</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  puck: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  score: {
    fontFamily: fonts.heading,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#8E8E93',
    letterSpacing: 0.1,
  },
});
