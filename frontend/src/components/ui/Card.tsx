import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, shadows, space } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  lifted?: boolean;
  padding?: number;
}

export default function Card({ children, style, lifted = false, padding = space[4] }: Props) {
  return (
    <View style={[styles.card, lifted && shadows.cardLifted, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.card,
  },
});
