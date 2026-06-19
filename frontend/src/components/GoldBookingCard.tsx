import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';
import { formatCountdown } from '../utils';

interface Props {
  secondsLeft: number;
}

export default function GoldBookingCard({ secondsLeft }: Props) {
  const sheenX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sheenX, {
        toValue: 400,
        duration: 2800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [sheenX]);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#C98A0E', colors.gold, '#F5C842']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.sheen,
          {
            transform: [
              { translateX: sheenX },
              { skewX: '-20deg' },
            ],
          },
        ]}
      />
      <View style={styles.row}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>2× COINS</Text>
        </View>
        <Text style={styles.timer}>{formatCountdown(secondsLeft)}</Text>
      </View>
      <Text style={styles.title}>Book today, earn double</Text>
      <Text style={styles.sub}>
        Complete a booking before the timer ends — extra coins land the moment the booking confirms.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontFamily: fonts.headingExtra, fontSize: 9, color: '#FFF', letterSpacing: 1 },
  timer: {
    fontFamily: fonts.headingExtra,
    fontSize: 12,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  title: { fontFamily: fonts.headingExtra, fontSize: 15, color: '#FFF', marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.9)', lineHeight: 16 },
});
