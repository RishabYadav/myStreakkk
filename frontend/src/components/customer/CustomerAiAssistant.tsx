import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, space, type as typeScale } from '../../theme';
import { Customer } from '../../types';
import { postCustomerAiChat, AiChatTurn } from '../../services/api';
import AiOrbLogo from './AiOrbLogo';
import { BreatheView, FadeSlideIn, LiveDot, PulseScale } from '../ui/motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  customer: Customer;
  bottomOffset?: number;
}

const QUICK_PROMPTS = [
  'What are my coverage gaps?',
  'How can I improve my score?',
  'Explain my health exposure',
];

const { height: SCREEN_H } = Dimensions.get('window');

function TypingIndicator() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 320, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.delay(280),
        ])
      );

    const a1 = bounce(d1, 0);
    const a2 = bounce(d2, 120);
    const a3 = bounce(d3, 240);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [d1, d2, d3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
  });

  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, dotStyle(d)]} />
        ))}
      </View>
      <Text style={styles.typingLabel}>Protection Coach is thinking</Text>
    </View>
  );
}

function MessageBubble({ item, index }: { item: ChatMessage; index: number }) {
  const isUser = item.role === 'user';
  return (
    <FadeSlideIn index={Math.min(index, 6)}>
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.msgAvatar}>
            <LinearGradient colors={['#059669', '#6366F1']} style={styles.msgAvatarGrad}>
              <Feather name="zap" size={12} color="#FFF" />
            </LinearGradient>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          {!isUser && (
            <LinearGradient
              colors={['rgba(52,211,153,0.12)', 'rgba(99,102,241,0.08)']}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
        </View>
      </View>
    </FadeSlideIn>
  );
}

export default function CustomerAiAssistant({ customer, bottomOffset = 64 }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_PROMPTS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<FlatList>(null);
  const fabScale = useRef(new Animated.Value(1)).current;

  const welcomeMessage = `Hi ${customer.name.split(' ')[0]}! I'm your **Protection Coach** — here to help with coverage gaps, your score, and what to fix first.`;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage.replace(/\*\*/g, ''),
        },
      ]);
    }
  }, [open, messages.length, welcomeMessage]);

  useEffect(() => {
    if (open) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages, typing, open]);

  const openChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    setOpen(true);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setTyping(true);
      setSuggestions([]);

      const history: AiChatTurn[] = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await postCustomerAiChat({
          customer_id: customer.customer_id,
          customer_name: customer.name,
          message: trimmed,
          history,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', content: res.reply },
        ]);
        if (res.suggestions?.length) setSuggestions(res.suggestions);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: 'Something went wrong. Please try again in a moment.',
          },
        ]);
        setSuggestions(QUICK_PROMPTS);
      } finally {
        setTyping(false);
      }
    },
    [typing, messages, customer]
  );

  const sheetHeight = SCREEN_H * 0.88;

  return (
    <>
      {!open && (
        <Animated.View
          style={[
            styles.fabWrap,
            {
              bottom: bottomOffset + insets.bottom,
              transform: [{ scale: fabScale }],
            },
          ]}
        >
          <Pressable onPress={openChat} style={styles.fabPress} accessibilityLabel="Open Protection Coach chat">
            <AiOrbLogo size={50} />
          </Pressable>
          <View style={styles.fabBadge}>
            <LiveDot color="#34D399" size={6} />
            <Text style={styles.fabBadgeText}>Ask me</Text>
          </View>
        </Animated.View>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.sheet, { height: sheetHeight, paddingBottom: insets.bottom }]}
          >
            <LinearGradient colors={['#065F46', '#0F766E', '#134E4A']} style={styles.sheetHeader}>
              <View style={styles.handle} />
              <View style={styles.headerRow}>
                <AiOrbLogo size={44} />
                <View style={styles.headerCopy}>
                  <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>Protection Coach</Text>
                    <View style={styles.onlineChip}>
                      <LiveDot color="#6EE7B7" size={5} />
                      <Text style={styles.onlineText}>Live</Text>
                    </View>
                  </View>
                  <Text style={styles.headerSub}>Your AI guide for {customer.name.split(' ')[0]}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOpen(false);
                  }}
                  style={styles.closeBtn}
                  accessibilityLabel="Close chat"
                >
                  <Feather name="x" size={20} color="#ECFDF5" />
                </Pressable>
              </View>
            </LinearGradient>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => <MessageBubble item={item} index={index} />}
              ListFooterComponent={typing ? <TypingIndicator /> : null}
            />

            {suggestions.length > 0 && !typing && (
              <View style={styles.suggestWrap}>
                <Text style={styles.suggestLabel}>Suggested</Text>
                <View style={styles.suggestRow}>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => sendMessage(s)}
                      style={styles.suggestChip}
                    >
                      <Text style={styles.suggestText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputBar}>
              <LinearGradient
                colors={['rgba(236,253,245,0.95)', '#FFFFFF']}
                style={styles.inputShell}
              >
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about your coverage, score, gaps..."
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  multiline
                  maxLength={500}
                  editable={!typing}
                  onSubmitEditing={() => sendMessage(input)}
                  returnKeyType="send"
                />
                <PulseScale min={typing ? 1 : 0.96} max={1} duration={800}>
                  <Pressable
                    onPress={() => sendMessage(input)}
                    disabled={!input.trim() || typing}
                    style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
                  >
                    <LinearGradient
                      colors={input.trim() && !typing ? ['#059669', '#6366F1'] : ['#CBD5E1', '#94A3B8']}
                      style={styles.sendGrad}
                    >
                      <Feather name="arrow-up" size={18} color="#FFF" />
                    </LinearGradient>
                  </Pressable>
                </PulseScale>
              </LinearGradient>
              <Text style={styles.inputHint}>Powered by PBPartners · API ready</Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 10,
    zIndex: 200,
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPress: { borderRadius: 999 },
  fabBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.5)',
  },
  fabBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: '#6EE7B7',
    letterSpacing: 0.2,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  sheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[4],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'center',
    marginBottom: space[3],
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  headerCopy: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  headerTitle: { fontFamily: fonts.headingExtra, fontSize: typeScale.body.fontSize, color: '#FFF' },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  onlineText: { fontFamily: fonts.bodyBold, fontSize: 9, color: '#A7F3D0' },
  headerSub: { ...typeScale.caption, color: 'rgba(167,243,208,0.9)', marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgList: { padding: space[4], paddingBottom: space[2], gap: space[3] },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space[2], maxWidth: '92%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse', maxWidth: '88%' },
  msgAvatar: { width: 28, height: 28, marginBottom: 2 },
  msgAvatarGrad: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    overflow: 'hidden',
    borderWidth: 1,
  },
  bubbleAi: {
    backgroundColor: '#FFF',
    borderColor: 'rgba(52,211,153,0.25)',
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.primary,
    lineHeight: 20,
  },
  bubbleTextUser: { color: '#FFF' },
  typingRow: { marginTop: space[2], gap: space[1] },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: radius.lg,
    borderTopLeftRadius: 4,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.2)',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#14B8A6',
  },
  typingLabel: {
    ...typeScale.caption,
    color: colors.text.tertiary,
    marginLeft: space[1],
  },
  suggestWrap: {
    paddingHorizontal: space[4],
    paddingBottom: space[2],
    gap: space[2],
  },
  suggestLabel: {
    ...typeScale.label,
    color: colors.text.tertiary,
    fontSize: 9,
  },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  suggestChip: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.pill,
  },
  suggestText: {
    fontFamily: fonts.bodySemi,
    fontSize: typeScale.caption.fontSize,
    color: '#065F46',
  },
  inputBar: {
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: '#FFF',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[2],
    borderRadius: radius.xl,
    paddingLeft: space[4],
    paddingRight: space[2],
    paddingVertical: space[2],
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySm.fontSize,
    color: colors.text.primary,
    maxHeight: 96,
    paddingVertical: space[2],
  },
  sendBtn: { marginBottom: 2 },
  sendBtnDisabled: { opacity: 0.7 },
  sendGrad: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputHint: {
    ...typeScale.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: space[2],
    fontSize: 10,
  },
});
