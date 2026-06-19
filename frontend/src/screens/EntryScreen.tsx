import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, space, type as typeScale } from '../theme';
import { AppFlow } from '../types';
import PressableScale from '../components/ui/PressableScale';
import { BreatheView, FadeSlideIn } from '../components/ui/motion';

interface Props {
  onSelectFlow: (flow: Exclude<AppFlow, 'entry'>) => void;
}

function RoleCard({
  icon,
  iconColors,
  accentColor,
  title,
  description,
  features,
  badge,
  onPress,
  index,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconColors: [string, string];
  accentColor: string;
  title: string;
  description: string;
  features: string[];
  badge?: string;
  onPress: () => void;
  index: number;
}) {
  return (
    <FadeSlideIn index={index}>
      <PressableScale onPress={onPress} style={styles.card} haptic>
        <LinearGradient colors={[accentColor, `${accentColor}88`]} style={styles.cardAccent} />
        <View style={styles.cardInner}>
          <LinearGradient colors={iconColors} style={styles.iconBox}>
            <Feather name={icon} size={22} color="#FFF" />
          </LinearGradient>
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{title}</Text>
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {description}
            </Text>
            <View style={styles.featureRow}>
              {features.map((f) => (
                <View key={f} style={[styles.featureChip, { borderColor: `${accentColor}33` }]}>
                  <Text style={[styles.featureText, { color: accentColor }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.arrowBtn, { backgroundColor: `${accentColor}14` }]}>
            <Feather name="arrow-right" size={18} color={accentColor} />
          </View>
        </View>
      </PressableScale>
    </FadeSlideIn>
  );
}

export default function EntryScreen({ onSelectFlow }: Props) {
  const insets = useSafeAreaInsets();

  const select = (flow: Exclude<AppFlow, 'entry'>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectFlow(flow);
  };

  return (
    <LinearGradient colors={['#0065FF', '#0056E0', '#EEF4FF']} style={styles.root}>
      <BreatheView style={styles.glowOrb} duration={4800} min={0.15} max={0.35} />

      <View
        style={[
          styles.page,
          {
            paddingTop: insets.top + space[5],
            paddingBottom: insets.bottom + space[4],
          },
        ]}
      >
        <FadeSlideIn index={0}>
          <View style={styles.brandBlock}>
            <View style={styles.brandTitles}>
              <Text style={styles.brandCadence}>Cadence</Text>
              <Text style={styles.brandBy}>by PolicyBazaar</Text>
            </View>
            <Text style={styles.tagline}>One engine. Two experiences.</Text>
          </View>
        </FadeSlideIn>

        <View style={styles.cards}>
          <RoleCard
            index={1}
            icon="zap"
            iconColors={['#FFB020', '#F59E0B']}
            accentColor="#D97706"
            title="I'm a Partner"
            description="Track streaks, missions, renewals, and customer opportunities."
            features={['Streaks', 'Grow', 'Customers']}
            onPress={() => select('partner')}
          />
          <RoleCard
            index={2}
            icon="shield"
            iconColors={['#0065FF', '#0050D4']}
            accentColor="#0065FF"
            title="I'm a Customer"
            description="Preview your protection score, coverage gaps, and AI guidance."
            features={['Score', 'Coverage', 'AI Coach']}
            badge="PREVIEW"
            onPress={() => select('customer')}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '18%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space[4],
    gap: space[5],
  },
  brandBlock: {
    alignItems: 'center',
    gap: space[2],
    maxWidth: 320,
  },
  brandTitles: {
    alignItems: 'center',
    gap: 0,
  },
  brandCadence: {
    fontFamily: fonts.headingExtra,
    fontSize: 38,
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 40,
  },
  brandBy: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginTop: -2,
  },
  tagline: {
    ...typeScale.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  cards: {
    width: '100%',
    maxWidth: 400,
    gap: space[3],
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[5],
    paddingHorizontal: space[4],
    paddingLeft: space[4] + 4,
    gap: space[3],
    minHeight: 108,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: fonts.headingExtra,
    fontSize: 17,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  featureChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#F8FAFF',
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#BFDBFE',
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: '#0065FF',
    letterSpacing: 0.5,
  },
});
