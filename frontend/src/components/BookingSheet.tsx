import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../theme';
import CoinBadge from './ui/CoinBadge';
import Button from './ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function BookingSheet({ visible, onClose, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, shadows.cardLifted]}>
        <View style={styles.handle} />
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Booking confirmed!</Text>
        <Text style={styles.desc}>
          Health policy booked for Anjali. Your streak is safe, and the reward just landed.
        </Text>

        <View style={styles.chips}>
          <View style={[styles.chip, shadows.card]}>
            <CoinBadge amount={500} size="lg" multiplier="2×" showLabel={false} />
            <View style={styles.chipTextWrap}>
              <Text style={styles.chipTitle}>Double coin multiplier</Text>
              <Text style={styles.chipSub}>Added to your wallet</Text>
            </View>
          </View>
          <View style={[styles.chip, shadows.card]}>
            <View style={styles.trophyCircle}>
              <Feather name="award" size={22} color={colors.partner.accent} />
            </View>
            <View style={styles.chipTextWrap}>
              <Text style={styles.chipTitle}>Monthly Master</Text>
              <Text style={styles.chipSub}>Day 30 milestone unlocked</Text>
            </View>
          </View>
        </View>

        <Button
          label="See Anjali's score rise in your book →"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onConfirm();
          }}
        />
        <Pressable style={styles.ghost} onPress={onClose} accessibilityRole="button">
          <Text style={styles.ghostText}>Back to streak</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[6],
    paddingTop: space[3],
    paddingBottom: space[8],
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    marginBottom: space[6],
  },
  emoji: { fontSize: 56, marginBottom: space[3] },
  title: { ...typeScale.title, color: colors.text.primary, marginBottom: space[2], textAlign: 'center' },
  desc: {
    ...typeScale.bodySm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: space[6],
    maxWidth: 320,
  },
  chips: { width: '100%', gap: space[3], marginBottom: space[6] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: colors.surface.canvasTint,
    borderRadius: radius.lg,
    padding: space[4],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minHeight: 72,
  },
  chipTextWrap: { flex: 1 },
  trophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.partner.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTitle: { fontFamily: fonts.heading, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary },
  chipSub: { ...typeScale.caption, color: colors.text.secondary, marginTop: 2 },
  ghost: {
    width: '100%',
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[3],
  },
  ghostText: { fontFamily: fonts.bodySemi, fontSize: typeScale.bodySm.fontSize, color: colors.text.secondary },
});
