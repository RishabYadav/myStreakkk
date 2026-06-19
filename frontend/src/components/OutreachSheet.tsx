import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, shadows, space, touch, type as typeScale } from '../theme';
import PressableScale from './ui/PressableScale';

interface Props {
  visible: boolean;
  customerName: string;
  talkingPoints: string[];
  actionLoading: 'call' | 'whatsapp' | null;
  onClose: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
}

export default function OutreachSheet({
  visible,
  customerName,
  talkingPoints,
  actionLoading,
  onClose,
  onCall,
  onWhatsApp,
}: Props) {
  const firstName = customerName.split(' ')[0] || 'Customer';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, shadows.cardLifted]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="message-circle" size={20} color={colors.partner.accent} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Conversation guide</Text>
            <Text style={styles.title}>Talk to {firstName}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button">
            <Feather name="x" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <Text style={styles.intro}>
          Use these AI-generated points naturally. Confirm the customer’s situation before making a recommendation.
        </Text>

        <ScrollView style={styles.pointsScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.points}>
            {talkingPoints.map((point, index) => (
              <View key={`${index}-${point}`} style={styles.pointCard}>
                <View style={styles.pointNumber}>
                  <Text style={styles.pointNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <PressableScale
            onPress={onCall}
            disabled={actionLoading !== null}
            style={[styles.action, styles.callAction]}
          >
            {actionLoading === 'call' ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Feather name="phone" size={18} color="#FFF" />
                <Text style={styles.actionText}>Call {firstName}</Text>
              </>
            )}
          </PressableScale>

          <PressableScale
            onPress={onWhatsApp}
            disabled={actionLoading !== null}
            style={[styles.action, styles.whatsappAction]}
          >
            {actionLoading === 'whatsapp' ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Feather name="message-circle" size={18} color="#FFF" />
                <Text style={styles.actionText}>Text on WhatsApp</Text>
              </>
            )}
          </PressableScale>
        </View>
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
    maxHeight: '86%',
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[5],
    paddingBottom: space[7],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginVertical: space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginBottom: space[3],
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.partner.accentSoft,
  },
  headerCopy: { flex: 1 },
  eyebrow: { ...typeScale.label, color: colors.partner.accent },
  title: { ...typeScale.heading, color: colors.text.primary, marginTop: 2 },
  close: {
    width: touch.min,
    height: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    ...typeScale.bodySm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: space[4],
  },
  pointsScroll: { maxHeight: 320 },
  points: { gap: space[3] },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    padding: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.surface.canvasTint,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pointNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.partner.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointNumberText: {
    fontFamily: fonts.headingExtra,
    color: colors.text.inverse,
    fontSize: 11,
  },
  pointText: {
    ...typeScale.bodySm,
    color: colors.text.primary,
    lineHeight: 20,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: space[3],
    marginTop: space[5],
  },
  action: {
    flex: 1,
    minHeight: touch.min,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  callAction: { backgroundColor: colors.partner.accent },
  whatsappAction: { backgroundColor: '#16A34A' },
  actionText: {
    fontFamily: fonts.heading,
    color: colors.text.inverse,
    fontSize: typeScale.bodySm.fontSize,
  },
});
