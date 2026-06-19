import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../theme';
import Button from './ui/Button';

type Answer = 'yes' | 'no' | 'skip' | null;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (termYes: boolean) => void;
}

function OptionBtn({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: 'yes' | 'no' | 'skip';
  selected: Answer;
  onSelect: () => void;
}) {
  const isSelected = selected === value;
  let bg = colors.surface.card;
  let border = colors.border.default;
  let color = colors.text.secondary;
  let weight: '600' | '700' = '600';

  if (isSelected) {
    if (value === 'yes') {
      bg = colors.status.success;
      border = colors.status.success;
      color = colors.text.inverse;
      weight = '700';
    } else if (value === 'no') {
      bg = colors.surface.canvas;
      border = colors.border.default;
      color = colors.text.primary;
      weight = '700';
    } else {
      bg = colors.partner.accentSoft;
      border = colors.partner.accent;
      color = colors.partner.accent;
    }
  }

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: bg, borderColor: border },
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={[styles.optionText, { color, fontFamily: weight === '700' ? fonts.bodyBold : fonts.bodySemi }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function QuestionnaireSheet({ visible, onClose, onSubmit }: Props) {
  const [q1, setQ1] = useState<Answer>(null);
  const [q2, setQ2] = useState<Answer>(null);
  const [q3, setQ3] = useState<Answer>(null);

  const hasAnyAnswer = q1 !== null || q2 !== null || q3 !== null;

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(q3 === 'yes');
    setQ1(null);
    setQ2(null);
    setQ3(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop} />
      <View style={[styles.sheet, shadows.cardLifted]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Feather name="phone" size={20} color={colors.partner.accent} />
            </View>
            <Text style={styles.title}>Add Anjali's outside cover</Text>
          </View>
          <Text style={styles.intro}>
            You already see Anjali's Motor and Life from PB. Ask her about anything held elsewhere
            and log it so her score is complete. Each question is optional.
          </Text>

          <View style={styles.question}>
            <Text style={styles.qText}>1. Does Anjali hold an external Health policy?</Text>
            <View style={styles.options}>
              <OptionBtn label="Yes" value="yes" selected={q1} onSelect={() => setQ1('yes')} />
              <OptionBtn label="No" value="no" selected={q1} onSelect={() => setQ1('no')} />
              <OptionBtn label="Skip" value="skip" selected={q1} onSelect={() => setQ1('skip')} />
            </View>
          </View>

          <View style={styles.question}>
            <Text style={styles.qText}>2. Does Anjali have external Commercial Motor cover?</Text>
            <View style={styles.options}>
              <OptionBtn label="Yes" value="yes" selected={q2} onSelect={() => setQ2('yes')} />
              <OptionBtn label="No" value="no" selected={q2} onSelect={() => setQ2('no')} />
              <OptionBtn label="Skip" value="skip" selected={q2} onSelect={() => setQ2('skip')} />
            </View>
          </View>

          <View style={[styles.question, styles.questionHighlight]}>
            <Text style={styles.qText}>3. Does Anjali hold an external Term Life policy?</Text>
            <View style={styles.options}>
              <OptionBtn label="Yes" value="yes" selected={q3} onSelect={() => setQ3('yes')} />
              <OptionBtn label="No" value="no" selected={q3} onSelect={() => setQ3('no')} />
              <OptionBtn label="Skip" value="skip" selected={q3} onSelect={() => setQ3('skip')} />
            </View>
          </View>

          <Button
            label="Update Anjali's score"
            variant="success"
            disabled={!hasAnyAnswer}
            onPress={handleSubmit}
          />
          <Pressable style={styles.ghost} onPress={onClose} accessibilityRole="button">
            <Text style={styles.ghostText}>Skip — keep her seeded score</Text>
          </Pressable>
        </ScrollView>
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
    maxHeight: '88%',
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[5],
    paddingBottom: space[6],
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: space[3],
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginBottom: space[3] },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.partner.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typeScale.heading, color: colors.text.primary, flex: 1 },
  intro: {
    ...typeScale.bodySm,
    color: colors.text.secondary,
    marginBottom: space[5],
  },
  question: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    padding: space[4],
    marginBottom: space[3],
    backgroundColor: colors.surface.canvas,
  },
  questionHighlight: {
    borderColor: colors.partner.accent,
    backgroundColor: colors.partner.accentSoft,
  },
  qText: { fontFamily: fonts.bodySemi, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary, marginBottom: space[3] },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  option: {
    flexGrow: 1,
    flexBasis: '30%',
    borderWidth: 1.5,
    borderRadius: radius.md,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[2],
  },
  optionText: { fontSize: typeScale.bodySm.fontSize },
  ghost: {
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[2],
    marginBottom: space[3],
  },
  ghostText: { fontFamily: fonts.bodySemi, fontSize: typeScale.bodySm.fontSize, color: colors.text.secondary },
});
