import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { puckHex } from '../utils';
import { fonts, shadows } from '../theme';

interface Props {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export default function ScorePuck({ score, size = 56, showLabel = false }: Props) {
  const color = puckHex(score);
  const fontSize = size * 0.36;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.puck,
          shadows.card,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            backgroundColor: `${color}14`,
          },
        ]}
      >
        <View style={[styles.innerRing, { borderColor: `${color}40` }]}>
          <Text style={[styles.score, { color, fontSize }]}>{score}</Text>
        </View>
      </View>
      {showLabel && <Text style={styles.label}>SCORE</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  puck: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  innerRing: {
    width: '82%',
    height: '82%',
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: { fontFamily: fonts.headingExtra },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 6,
    letterSpacing: 1.2,
  },
});
