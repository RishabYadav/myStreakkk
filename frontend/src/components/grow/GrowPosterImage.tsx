import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme';

interface Props {
  dataBase64?: string | null;
  mimeType?: string;
  loading?: boolean;
  error?: string | null;
  fallback?: React.ReactNode;
  width?: number;
}

export default function GrowPosterImage({
  dataBase64,
  mimeType = 'image/png',
  loading = false,
  error = null,
  fallback = null,
  width,
}: Props) {
  if (loading) {
    return (
      <View style={[styles.wrap, width ? { width } : null, styles.center]}>
        <ActivityIndicator color={colors.partner.accent} size="large" />
        <Text style={styles.loadingText}>Generating preview…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.wrap, width ? { width } : null, styles.center, styles.errorBox]}>
        <Feather name="alert-circle" size={22} color={colors.text.tertiary} />
        <Text style={styles.errorText}>{error}</Text>
        {fallback}
      </View>
    );
  }

  if (dataBase64) {
    return (
      <View style={[styles.wrap, width ? { width, alignSelf: 'center' } : null]}>
        <Image
          source={{ uri: `data:${mimeType};base64,${dataBase64}` }}
          style={[styles.image, width ? { width, height: width } : null]}
          resizeMode="cover"
          accessibilityLabel="Generated shareable poster preview"
        />
      </View>
    );
  }

  if (fallback) {
    return <View style={[styles.wrap, width ? { width } : null]}>{fallback}</View>;
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.tertiary,
  },
  errorBox: {
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
