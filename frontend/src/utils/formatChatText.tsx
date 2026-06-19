import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { fonts } from '../theme';

const BOLD_PATTERN = /(\*\*[^*]+?\*\*)/g;

export function FormattedChatText({
  children,
  style,
  boldStyle,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
}) {
  const parts = children.split(BOLD_PATTERN);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={boldStyle ?? { fontFamily: fonts.bodyBold }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}
