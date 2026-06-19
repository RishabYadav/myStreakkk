import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { colors, fonts, radius, space, type as typeScale } from '../../theme';
import { CoverageRow } from '../../types';
import AccordionToggle from '../ui/AccordionToggle';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  rows: CoverageRow[];
  initialVisible?: number;
}

export default function CoverageAccordion({ rows, initialVisible = 2 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = rows.length > initialVisible;
  const visibleRows = expanded ? rows : rows.slice(0, initialVisible);
  const remaining = Math.max(0, rows.length - initialVisible);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.wrap}>
      {visibleRows.map((row, index) => (
        <View
          key={row.id}
          style={[
            styles.row,
            (index < visibleRows.length - 1 || hasMore) && styles.rowBorder,
          ]}
        >
          <Text style={styles.name}>{row.name} Insurance</Text>
          <View style={[styles.statusPill, row.covered && styles.statusCovered]}>
            <Text style={[styles.statusText, row.covered && styles.statusTextCovered]}>
              {row.covered ? 'Covered' : 'Not covered'}
            </Text>
          </View>
        </View>
      ))}
      {hasMore ? (
        <AccordionToggle
          expanded={expanded}
          onToggle={toggle}
          remainingCount={remaining}
          label={expanded ? 'Show less' : `Show ${remaining} more`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: space[4],
    gap: space[3],
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  wrap: {
    marginHorizontal: space[4],
    marginBottom: space[4],
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  name: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.primary,
  },
  statusPill: {
    paddingHorizontal: space[3],
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.canvas,
  },
  statusCovered: {
    backgroundColor: colors.status.successSoft,
  },
  statusText: {
    fontFamily: fonts.bodySemi,
    fontSize: typeScale.caption.fontSize,
    color: colors.text.secondary,
  },
  statusTextCovered: {
    color: colors.status.success,
  },
});
