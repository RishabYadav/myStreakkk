import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '../theme';
import { BreatheView } from './ui/motion';

interface Props {
  score: number;
  size?: number;
  strokeColor?: string;
  trackColor?: string;
  textColor?: string;
}

export default function ScoreRing({
  score,
  size = 130,
  strokeColor = 'rgba(255,255,255,0.95)',
  trackColor = 'rgba(255,255,255,0.12)',
  textColor = '#FFFFFF',
}: Props) {
  const stroke = 10;
  const radius = (size - stroke) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const [displayScore, setDisplayScore] = useState(score);
  const [dashOffset, setDashOffset] = useState(circumference * (1 - score / 100));
  const prevScore = useRef(score);

  useEffect(() => {
    const start = prevScore.current;
    const end = score;
    prevScore.current = score;

    if (start === end) {
      setDashOffset(circumference * (1 - end / 100));
      setDisplayScore(end);
      return;
    }

    const startTime = Date.now();
    const duration = 1000;
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const currentScore = Math.round(start + (end - start) * eased);
      setDisplayScore(currentScore);
      setDashOffset(circumference * (1 - (start + (end - start) * eased) / 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, circumference]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <BreatheView
        duration={2200}
        min={0.2}
        max={0.55}
        style={{
          position: 'absolute',
          width: size + 16,
          height: size + 16,
          borderRadius: (size + 16) / 2,
          borderWidth: 2,
          borderColor: strokeColor,
        }}
      />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cy} r={radius} stroke={trackColor} strokeWidth={stroke} fill="transparent" />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.score, { color: textColor }]}>{displayScore}</Text>
        <Text style={[styles.sub, { color: `${textColor}CC` }]}>out of 100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  score: { fontFamily: fonts.headingExtra, fontSize: 36, lineHeight: 40 },
  sub: { fontFamily: fonts.body, fontSize: 9, marginTop: 2 },
});
