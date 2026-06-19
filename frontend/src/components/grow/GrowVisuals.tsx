import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';
import { fonts } from '../../theme';

interface PosterProps {
  customerName: string;
  motorDaysLeft: number;
  protectionScore: number;
}

export function MotorRenewalPoster({ customerName, motorDaysLeft }: PosterProps) {
  return (
    <View style={styles.posterWrap}>
      <LinearGradient colors={['#1B2A6B', '#2B52CC', '#121c4b']} style={StyleSheet.absoluteFill} />
      <View style={styles.posterGrid} />
      <Svg width={90} height={90} style={styles.posterDial} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="5,3" fill="none" />
        <Circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
        <Line x1="50" y1="50" x2="80" y2="20" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
        <Path d="M10 50 A40 40 0 0 1 90 50" stroke="#0FB67E" strokeWidth="3" strokeLinecap="round" fill="none" />
      </Svg>
      <View style={styles.carRow}>
        <Svg width={140} height={45} viewBox="0 0 120 45">
          <Path d="M5 25 C15 5, 105 5, 115 25" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
          <Path
            d="M10 25 C10 21, 24 16, 32 14 C42 12, 78 12, 88 14 C96 16, 110 21, 110 25 C110 27, 102 32, 98 32 C85 33, 35 33, 22 32 C18 32, 10 27, 10 25 Z"
            fill="#2B52CC"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.5"
          />
          <Circle cx="28" cy="31" r="7.5" fill="#1B2A6B" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <Circle cx="28" cy="31" r="3" fill="#EEF2FF" />
          <Circle cx="92" cy="31" r="7.5" fill="#1B2A6B" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <Circle cx="92" cy="31" r="3" fill="#EEF2FF" />
          <Polygon points="106,21 110,23 108,25" fill="#0FB67E" />
        </Svg>
      </View>
      <View style={styles.posterTopRow}>
        <Text style={styles.posterBrand}>PBPartners Premium</Text>
        <Text style={styles.posterTag}>SECURE SHIELD</Text>
      </View>
      <LinearGradient colors={['transparent', 'rgba(14,23,63,0.95)']} style={styles.posterBottom}>
        <Text style={styles.posterTitle}>Your Motor Policy Renews in {motorDaysLeft} Days</Text>
        <View style={styles.goldNameRow}>
          <View style={styles.goldDot} />
          <Text style={styles.goldName}>{customerName.toUpperCase()}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export function HealthReportPoster({ customerName, protectionScore }: PosterProps) {
  return (
    <View style={styles.posterWrap}>
      <LinearGradient colors={['#1B2A6B', '#1a388e', '#0d1330']} style={StyleSheet.absoluteFill} />
      <View style={styles.shieldWrap}>
        <Svg width={56} height={56} viewBox="0 0 100 100">
          <Path d="M50,15 L80,25 C80,55 50,85 50,85 C50,85 20,55 20,25 Z" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" />
          <Circle cx="50" cy="50" r="38" stroke="rgba(255,163,23,0.15)" strokeWidth="2" strokeDasharray="3 3" fill="none" />
          <Circle cx="50" cy="48" r="20" fill="#0FB67E" fillOpacity={0.85} />
          <Path d="M42,48 L48,54 L58,40" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </View>
      <View style={styles.posterTopRow}>
        <Text style={styles.posterBrand}>Safety Score check-in</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeText}>SCORE: {protectionScore}%</Text>
        </View>
      </View>
      <LinearGradient colors={['transparent', 'rgba(14,22,61,0.92)']} style={styles.posterBottom}>
        <Text style={styles.posterTitle}>Your Protection Score: {protectionScore} / 100</Text>
        <View style={styles.goldNameRow}>
          <View style={styles.goldDot} />
          <Text style={styles.goldName}>{customerName.toUpperCase()}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export function CongratsGreetingCard({ customerName }: { customerName: string }) {
  return (
    <View style={[styles.greetingCard, styles.greetingCongrats]}>
      <View style={styles.confetti1} />
      <View style={styles.confetti2} />
      <View style={styles.confetti3} />
      <Text style={styles.congratsScript}>Congratulations!</Text>
      <View style={styles.greetingNamePill}>
        <Text style={styles.greetingNameGreen}>{customerName}</Text>
      </View>
      <Text style={styles.greetingBrand}>PBPartners</Text>
    </View>
  );
}

export function HeartTreeGreetingCard({ customerName }: { customerName: string }) {
  return (
    <View style={[styles.greetingCard, styles.greetingHeart]}>
      <View style={styles.heartFrame} />
      <Svg width={80} height={80} style={styles.heartTree} viewBox="0 0 105 105">
        <Path d="M68,78 Q71,64 64,48 Q57,32 50,53" stroke="#8b4f30" strokeWidth="3" strokeLinecap="round" fill="none" />
        <Path d="M60,18 C58,16 54,16 52,18 C50,20 50,24 52,26 L60,34 L68,26 C70,24 70,20 68,18 C66,16 62,16 60,18 Z" fill="#db2777" />
        <Path d="M45,35 C43,33 39,33 37,35 C35,37 35,41 37,43 L45,51 L53,43 C55,41 55,37 53,35 C51,33 47,33 45,35 Z" fill="#e11d48" />
        <Path d="M72,40 C70,38 66,38 64,40 C62,42 62,46 64,48 L72,56 L80,48 C82,46 82,42 80,40 C78,38 74,38 72,40 Z" fill="#f43f5e" />
      </Svg>
      <Text style={styles.heartTitle}>Thinking of You</Text>
      <Text style={styles.heartSub}>SECURE CHERISH</Text>
      <Text style={styles.heartLabel}>Warm greetings for:</Text>
      <Text style={styles.heartName}>{customerName}</Text>
    </View>
  );
}

export function ThankYouGreetingCard({ customerName }: { customerName: string }) {
  return (
    <View style={[styles.greetingCard, styles.greetingThank]}>
      <Text style={styles.thankTitle}>Thank You!</Text>
      <Text style={styles.thankSub}>Happy Partnership</Text>
      <Text style={styles.thankBody}>
        We deeply appreciate your trust. Here is to custom wellness & safety coverage year after year!
      </Text>
      <Text style={styles.thankName}>{customerName}</Text>
      <Text style={styles.thankMeta}>Custom Protection Partner</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  posterWrap: {
    aspectRatio: 2.35,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226,232,240,0.5)',
  },
  posterGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  posterDial: { position: 'absolute', top: 8, right: 12, opacity: 0.35 },
  carRow: { position: 'absolute', top: '18%', alignSelf: 'center' },
  posterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    zIndex: 2,
  },
  posterBrand: {
    fontFamily: fonts.headingExtra,
    fontSize: 8,
    color: '#EEF2FF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#0FB67E',
    paddingBottom: 2,
  },
  posterTag: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: 'rgba(238,242,255,0.8)',
    fontStyle: 'italic',
  },
  scoreBadge: {
    backgroundColor: 'rgba(15,182,126,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(15,182,126,0.3)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreBadgeText: {
    fontFamily: fonts.headingExtra,
    fontSize: 8,
    color: '#0FB67E',
    fontWeight: '700',
  },
  posterBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  posterTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFF',
    lineHeight: 17,
    maxWidth: '92%',
  },
  goldNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  goldDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F8D26A' },
  goldName: {
    fontFamily: fonts.headingExtra,
    fontSize: 11,
    color: '#F8D26A',
    letterSpacing: 1,
  },
  shieldWrap: { position: 'absolute', top: '16%', alignSelf: 'center' },
  greetingCard: {
    width: 200,
    height: 200,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingCongrats: {
    backgroundColor: '#FCF5EE',
    borderWidth: 1,
    borderColor: 'rgba(180,130,80,0.12)',
  },
  confetti1: {
    position: 'absolute',
    top: '28%',
    left: '32%',
    width: 6,
    height: 12,
    backgroundColor: '#FBBF24',
    transform: [{ rotate: '12deg' }],
    borderRadius: 2,
    opacity: 0.8,
  },
  confetti2: {
    position: 'absolute',
    top: '36%',
    right: '26%',
    width: 12,
    height: 6,
    backgroundColor: '#EAB308',
    transform: [{ rotate: '-45deg' }],
    borderRadius: 2,
    opacity: 0.8,
  },
  confetti3: {
    position: 'absolute',
    bottom: '30%',
    left: 48,
    width: 8,
    height: 8,
    backgroundColor: '#CA8A04',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
    opacity: 0.6,
  },
  congratsScript: {
    fontFamily: fonts.headingExtra,
    fontSize: 26,
    color: '#A6532B',
    marginBottom: 8,
  },
  greetingNamePill: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,135,90,0.15)',
  },
  greetingNameGreen: {
    fontFamily: fonts.headingExtra,
    fontSize: 14,
    color: '#00875A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  greetingBrand: {
    marginTop: 14,
    fontFamily: fonts.bodySemi,
    fontSize: 8,
    color: 'rgba(120,53,15,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  greetingHeart: {
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: 'rgba(200,120,150,0.12)',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heartFrame: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.06)',
  },
  heartTree: { position: 'absolute', top: 24, right: 8 },
  heartTitle: { fontFamily: fonts.headingExtra, fontSize: 17, color: '#BE185D' },
  heartSub: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  heartLabel: { fontFamily: fonts.body, fontSize: 11, color: '#64748B', marginTop: 8 },
  heartName: {
    fontFamily: fonts.headingExtra,
    fontSize: 15,
    color: '#831843',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  greetingThank: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: 'rgba(30,120,220,0.1)',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  thankTitle: { fontFamily: fonts.headingExtra, fontSize: 17, color: '#0F2942' },
  thankSub: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: 'rgba(29,78,216,0.8)',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  thankBody: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
    marginTop: 10,
    maxWidth: 200,
  },
  thankName: {
    fontFamily: fonts.headingExtra,
    fontSize: 15,
    color: '#1B2A6B',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  thankMeta: { fontFamily: fonts.body, fontSize: 9, color: '#94A3B8', marginTop: 2 },
});
