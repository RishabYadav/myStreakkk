import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme';

export default function ThreadConnector() {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[colors.canvas, colors.accent, colors.canvas]}
        style={styles.line}
      />
      <View style={styles.labelWrap}>
        <Text style={styles.label}>↓ so today's mission is</Text>
      </View>
      <LinearGradient
        colors={[colors.canvas, colors.accent, colors.canvas]}
        style={styles.lineShort}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  line: { width: 3, height: 16, borderRadius: 2 },
  labelWrap: {
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,106,61,0.2)',
  },
  label: {
    fontFamily: fonts.headingExtra,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 0.3,
  },
  lineShort: { width: 3, height: 10, borderRadius: 2 },
});
