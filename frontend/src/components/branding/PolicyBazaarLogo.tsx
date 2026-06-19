import React from 'react';
import { Image, View, ViewStyle } from 'react-native';

/** Official PolicyBazaar logo — static.pbcdn.in/cdn/images/home/og_pb_logo.png */
const LOGO = require('../../../assets/branding/policybazaar-logo.png');

const ASPECT = 1096 / 594;

interface Props {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export default function PolicyBazaarLogo({ width = 140, height, style }: Props) {
  const resolvedHeight = height ?? width / ASPECT;

  return (
    <View style={style} accessibilityRole="image" accessibilityLabel="PolicyBazaar">
      <Image source={LOGO} style={{ width, height: resolvedHeight }} resizeMode="contain" />
    </View>
  );
}
