import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { fonts } from '../theme';

interface Props {
  score: number;
  min?: number;
  max?: number;
  width?: number;
  subtitle?: React.ReactNode;
  scoreColor?: string;
}

const GRADIENT = [
  { stop: 0, color: '#EF4444' },
  { stop: 0.18, color: '#F97316' },
  { stop: 0.38, color: '#FACC15' },
  { stop: 0.58, color: '#A3E635' },
  { stop: 0.78, color: '#4ADE80' },
  { stop: 1, color: '#16A34A' },
];

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const largeArc = startAngle - endAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function scoreTier(score: number) {
  if (score >= 84) return { label: 'Excellent', color: '#16A34A', bg: '#DCFCE7' };
  if (score >= 70) return { label: 'Good', color: '#65A30D', bg: '#ECFCCB' };
  if (score >= 55) return { label: 'Fair', color: '#CA8A04', bg: '#FEF9C3' };
  if (score >= 40) return { label: 'Needs work', color: '#EA580C', bg: '#FFEDD5' };
  return { label: 'At risk', color: '#DC2626', bg: '#FEE2E2' };
}

export default function ScoreMeter({
  score,
  min = 0,
  max = 100,
  width = 300,
  subtitle,
  scoreColor = '#1E3A8A',
}: Props) {
  const gradId = useId().replace(/:/g, '');
  const trackStroke = 20;
  const arcStroke = 16;
  const radius = width * 0.38;
  const cx = width / 2;
  const cy = radius + 18;
  const svgHeight = cy + 14;
  const gaugeHeight = svgHeight + 88;

  const [displayScore, setDisplayScore] = useState(score);
  const [pointerAngle, setPointerAngle] = useState(() => {
    const t = Math.min(Math.max((score - min) / (max - min), 0), 1);
    return Math.PI * (1 - t);
  });
  const prevScore = useRef(score);

  useEffect(() => {
    const start = prevScore.current;
    const end = score;
    prevScore.current = score;

    if (start === end) {
      const t = Math.min(Math.max((end - min) / (max - min), 0), 1);
      setPointerAngle(Math.PI * (1 - t));
      setDisplayScore(end);
      return;
    }

    const startTime = Date.now();
    const duration = 900;
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 3);
      const current = start + (end - start) * eased;
      const t = Math.min(Math.max((current - min) / (max - min), 0), 1);
      setDisplayScore(Math.round(current));
      setPointerAngle(Math.PI * (1 - t));
      if (elapsed < duration) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, min, max]);

  const arcPath = useMemo(() => describeArc(cx, cy, radius, Math.PI, 0), [cx, cy, radius]);
  const tier = useMemo(() => scoreTier(displayScore), [displayScore]);

  const knob = useMemo(() => polar(cx, cy, radius, pointerAngle), [cx, cy, radius, pointerAngle]);
  const needleInner = useMemo(
    () => polar(cx, cy, radius - arcStroke * 0.55, pointerAngle),
    [cx, cy, radius, pointerAngle, arcStroke],
  );

  const ticks = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const angle = Math.PI * (1 - t);
      return {
        t,
        angle,
        inner: polar(cx, cy, radius - trackStroke / 2 - 2, angle),
        outer: polar(cx, cy, radius + trackStroke / 2 + 2, angle),
        label: polar(cx, cy, radius + trackStroke / 2 + 16, angle),
      };
    });
  }, [cx, cy, radius, trackStroke]);

  const leftEnd = polar(cx, cy, radius, Math.PI);
  const rightEnd = polar(cx, cy, radius, 0);

  return (
    <View style={[styles.wrap, { width, height: gaugeHeight }]}>
      <View style={[styles.gaugeGlow, { width: radius * 1.85, height: radius * 1.1, top: 8, left: (width - radius * 1.85) / 2 }]} />
      <Svg width={width} height={svgHeight} style={styles.svg}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {GRADIENT.map((seg) => (
              <Stop key={seg.stop} offset={`${seg.stop * 100}%`} stopColor={seg.color} />
            ))}
          </LinearGradient>
        </Defs>

        <Path
          d={arcPath}
          stroke="#E8EDF5"
          strokeWidth={trackStroke}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={arcPath}
          stroke={`url(#${gradId})`}
          strokeWidth={arcStroke}
          fill="none"
          strokeLinecap="round"
        />

        {ticks.map(({ t, inner, outer }) => (
          <Line
            key={t}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="#CBD5E1"
            strokeWidth={t === 0 || t === 1 ? 0 : 1.5}
            strokeLinecap="round"
          />
        ))}

        <G>
          <Circle cx={knob.x} cy={knob.y} r={13} fill="rgba(15,23,42,0.12)" />
          <Circle cx={knob.x} cy={knob.y - 1} r={11} fill="#FFFFFF" stroke="#1E3A8A" strokeWidth={2.5} />
          <Circle cx={knob.x} cy={knob.y - 1} r={4.5} fill={tier.color} />
          <Line
            x1={knob.x}
            y1={knob.y - 1}
            x2={needleInner.x}
            y2={needleInner.y}
            stroke="#1E3A8A"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      <Text style={[styles.endLabel, { left: leftEnd.x - 14, top: leftEnd.y + 6 }]}>{min}</Text>
      <Text style={[styles.endLabel, { left: rightEnd.x - 14, top: rightEnd.y + 6 }]}>{max}</Text>

      <View style={styles.scoreZone}>
        <View style={[styles.tierPill, { backgroundColor: tier.bg }]}>
          <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
          <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
        </View>
        <Text style={[styles.score, { color: scoreColor }]}>{displayScore}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    position: 'relative',
  },
  gaugeGlow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    opacity: 0.85,
  },
  svg: {
    alignSelf: 'center',
  },
  endLabel: {
    position: 'absolute',
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#94A3B8',
    width: 28,
    textAlign: 'center',
  },
  scoreZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 6,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  score: {
    fontFamily: fonts.headingExtra,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 270,
  },
});
