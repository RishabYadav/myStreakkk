import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
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

function scoreToAngle(score: number, min: number, max: number) {
  const t = Math.min(Math.max((score - min) / (max - min), 0), 1);
  return Math.PI * (1 - t);
}

function angleToScore(angle: number, min: number, max: number) {
  const clamped = Math.min(Math.max(angle, 0), Math.PI);
  const t = 1 - clamped / Math.PI;
  return Math.round(min + t * (max - min));
}

function arrowPoints(cx: number, cy: number, r: number, angleRad: number) {
  const px = cx + r * Math.cos(angleRad);
  const py = cy - r * Math.sin(angleRad);
  const toCenter = Math.atan2(cy - py, cx - px);
  const depth = 16;
  const base = 11;
  const tipX = px + Math.cos(toCenter) * depth;
  const tipY = py + Math.sin(toCenter) * depth;
  const perp = toCenter + Math.PI / 2;
  const half = base / 2;
  const b1x = px + Math.cos(perp) * half;
  const b1y = py + Math.sin(perp) * half;
  const b2x = px - Math.cos(perp) * half;
  const b2y = py - Math.sin(perp) * half;
  return `${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`;
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

  const [displayScore, setDisplayScore] = useState(score);
  const [pointerAngle, setPointerAngle] = useState(() => scoreToAngle(score, min, max));
  const [dragging, setDragging] = useState(false);
  const dragScoreRef = useRef<number | null>(null);
  const prevScore = useRef(score);
  const geomRef = useRef({ cx, cy, min, max });

  geomRef.current = { cx, cy, min, max };

  useEffect(() => {
    if (dragging) return;
    const start = prevScore.current;
    const end = score;
    prevScore.current = score;

    if (start === end) {
      setPointerAngle(scoreToAngle(end, min, max));
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
      setDisplayScore(Math.round(current));
      setPointerAngle(scoreToAngle(current, min, max));
      if (elapsed < duration) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, min, max, dragging]);

  const applyTouch = useCallback((locationX: number, locationY: number) => {
    const { cx: gcx, cy: gcy, min: gMin, max: gMax } = geomRef.current;
    const dx = locationX - gcx;
    const dy = gcy - locationY;
    if (dy < -8) return;
    let angle = Math.atan2(dy, dx);
    if (angle < 0 || angle > Math.PI) return;
    const next = angleToScore(angle, gMin, gMax);
    dragScoreRef.current = next;
    setDisplayScore(next);
    setPointerAngle(angle);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setDragging(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          applyTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt) => {
          applyTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: () => {
          setDragging(false);
          dragScoreRef.current = null;
          const end = prevScore.current;
          setDisplayScore(end);
          setPointerAngle(scoreToAngle(end, min, max));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          dragScoreRef.current = null;
          setDisplayScore(prevScore.current);
          setPointerAngle(scoreToAngle(prevScore.current, min, max));
        },
      }),
    [applyTouch, min, max],
  );

  const arcPath = useMemo(() => describeArc(cx, cy, radius, Math.PI, 0), [cx, cy, radius]);
  const tier = useMemo(() => scoreTier(displayScore), [displayScore]);
  const arrow = useMemo(() => arrowPoints(cx, cy, radius, pointerAngle), [cx, cy, radius, pointerAngle]);
  const arrowBase = useMemo(() => polar(cx, cy, radius, pointerAngle), [cx, cy, radius, pointerAngle]);

  const ticks = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const angle = Math.PI * (1 - t);
      return {
        t,
        inner: polar(cx, cy, radius - trackStroke / 2 - 2, angle),
        outer: polar(cx, cy, radius + trackStroke / 2 + 2, angle),
      };
    });
  }, [cx, cy, radius, trackStroke]);

  const leftEnd = polar(cx, cy, radius, Math.PI);
  const rightEnd = polar(cx, cy, radius, 0);
  const innerScoreTop = cy - radius * 0.62;
  const belowArcTop = svgHeight + 14;
  const gaugeHeight = belowArcTop + 44;

  return (
    <View style={[styles.wrap, { width, height: gaugeHeight }]}>
      <View style={[styles.arcZone, { height: svgHeight }]} {...panResponder.panHandlers}>
        <Svg width={width} height={svgHeight}>
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
            <Circle
              cx={arrowBase.x}
              cy={arrowBase.y}
              r={dragging ? 7 : 5}
              fill="#FFFFFF"
              stroke="#1E3A8A"
              strokeWidth={2}
            />
            <Polygon points={arrow} fill="#1E3A8A" />
          </G>
        </Svg>

        <Text style={[styles.endLabel, { left: leftEnd.x - 14, top: leftEnd.y + 6 }]}>{min}</Text>
        <Text style={[styles.endLabel, { left: rightEnd.x - 14, top: rightEnd.y + 6 }]}>{max}</Text>

        <View style={[styles.innerScore, { top: innerScoreTop }]} pointerEvents="none">
          <View style={[styles.tierPill, { backgroundColor: tier.bg }]}>
            <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
            <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
          </View>
          <Text style={[styles.score, { color: scoreColor }]}>{displayScore}</Text>
        </View>
      </View>

      <View style={[styles.belowArc, { top: belowArcTop }]} pointerEvents="none">
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {dragging ? <Text style={styles.dragHint}>Release to set back to {score}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  arcZone: {
    width: '100%',
    position: 'relative',
  },
  endLabel: {
    position: 'absolute',
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#94A3B8',
    width: 28,
    textAlign: 'center',
  },
  innerScore: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  belowArc: {
    position: 'absolute',
    left: 0,
    right: 0,
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
    lineHeight: 18,
    maxWidth: 270,
  },
  dragHint: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});
