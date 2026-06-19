import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadows, space, type as typeScale } from '../theme';
import { AppFlow } from '../types';
import PressableScale from '../components/ui/PressableScale';
import { FadeSlideIn, FloatView } from '../components/ui/motion';

interface Props {
  onSelectFlow: (flow: Exclude<AppFlow, 'entry'>) => void;
}

function RoleCard({
  icon,
  iconColors,
  accentLine,
  title,
  description,
  badge,
  onPress,
  index,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconColors: [string, string];
  accentLine?: string;
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
  index: number;
}) {
  return (
    <FadeSlideIn index={index}>
      <PressableScale onPress={onPress} style={styles.card} haptic>
        <View style={styles.cardInner}>
          <View style={styles.cardLeft}>
            <LinearGradient colors={iconColors} style={styles.iconBox}>
              <Feather name={icon} size={22} color="#FFF" />
            </LinearGradient>
            {accentLine ? <View style={[styles.accentLine, { backgroundColor: accentLine }]} /> : null}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{description}</Text>
            {badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <Feather name="chevron-right" size={20} color="#CBD5E1" />
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
    <LinearGradient colors={['#2563EB', '#1D4ED8', '#1E3A8A']} style={styles.root}>
      <View style={[styles.content, { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[6] }]}>
        <FadeSlideIn index={0}>
          <View style={styles.brandBlock}>
            <FloatView distance={3} duration={2400}>
              <View style={styles.logoRing}>
                <View style={styles.logoInner}>
                  <View style={styles.logoDot} />
                </View>
              </View>
            </FloatView>
            <Text style={styles.brandName}>Cadence</Text>
            <Text style={styles.tagline}>One engine. Two experiences.</Text>
          </View>
        </FadeSlideIn>

        <View style={styles.cards}>
          <RoleCard
            index={1}
            icon="zap"
            iconColors={['#FBBF24', '#F59E0B']}
            accentLine="#FBBF24"
            title="I'm a Partner"
            description="Track your streak, missions, and customer opportunities"
            onPress={() => select('partner')}
          />
          <RoleCard
            index={2}
            icon="shield"
            iconColors={['#059669', '#047857']}
            title="I'm a Customer"
            description="See what protection intelligence looks like for you"
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
  content: {
    flex: 1,
    paddingHorizontal: space[5],
    justifyContent: 'center',
    gap: space[8],
  },
  brandBlock: { alignItems: 'center', gap: space[2] },
  logoRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  logoInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  brandName: {
    fontFamily: fonts.headingExtra,
    fontSize: 32,
    color: '#FFF',
    letterSpacing: -0.8,
  },
  tagline: {
    ...typeScale.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  cards: { gap: space[4] },
  card: {
    backgroundColor: '#FFF',
    borderRadius: radius.xl,
    ...shadows.cardLifted,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[5],
    gap: space[4],
  },
  cardLeft: { alignItems: 'center', gap: space[2] },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLine: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: {
    fontFamily: fonts.headingExtra,
    fontSize: 17,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.customer.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.customerGreen,
    letterSpacing: 0.8,
  },
});
