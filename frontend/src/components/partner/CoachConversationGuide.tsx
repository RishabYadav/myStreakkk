import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts, radius, space, type as typeScale } from '../../theme';

export interface LessonItem {
  priority: boolean;
  icon: string;
  title: string;
  body: string;
}

interface Props {
  customerFirstName: string;
  talkingPoints: string[];
  lessons: LessonItem[];
}

const PRIORITY_ACCENT = '#FF6A3D';

export default function CoachConversationGuide({
  customerFirstName,
  talkingPoints,
  lessons,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LESSONS</Text>
        <Text style={styles.sectionSub}>Why this matters for {customerFirstName}</Text>
        <View style={styles.lessonList}>
          {lessons.map((lesson, idx) => (
            <View key={`${lesson.title}-${idx}`} style={styles.lessonCard}>
              {lesson.priority ? <Text style={styles.priorityTag}>PRIORITY</Text> : null}
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonBody}>{lesson.body}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TALKING POINTS</Text>
        <Text style={styles.sectionSub}>Say these on the call, in order</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineLine} />
          {talkingPoints.map((point, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{idx + 1}</Text>
              </View>
              <View style={styles.talkCard}>
                <Text style={styles.talkText}>{point}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#F4F7FF',
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F8',
  },
  section: {
    gap: space[2],
  },
  sectionTitle: {
    fontFamily: fonts.headingExtra,
    fontSize: 13,
    color: '#2563EB',
    letterSpacing: 1.1,
  },
  sectionSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#64748B',
    marginTop: -2,
  },
  lessonList: {
    gap: space[3],
    marginTop: space[1],
  },
  lessonCard: {
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: space[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8EDF5',
  },
  priorityTag: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: PRIORITY_ACCENT,
    letterSpacing: 0.8,
  },
  lessonTitle: {
    fontFamily: fonts.heading,
    fontSize: typeScale.body.fontSize,
    color: '#1B2A6B',
    lineHeight: 20,
  },
  lessonBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySm.fontSize,
    color: '#64748B',
    lineHeight: 19,
  },
  timeline: {
    marginTop: space[1],
    paddingLeft: 2,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 18,
    bottom: 18,
    width: 2,
    backgroundColor: '#C7D7F5',
    borderRadius: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginBottom: space[3],
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1B2A6B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  talkCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: space[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8EDF5',
  },
  talkText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: '#1B2A6B',
    lineHeight: 20,
  },
});
