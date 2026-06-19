import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  Share,
  LayoutAnimation,
  Platform,
  UIManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { colors, fonts, radius, shadows, space, type as typeScale } from '../theme';
import { Customer, GrowCardTemplate } from '../types';
import Toast from '../components/ui/Toast';
import PressableScale from '../components/ui/PressableScale';
import PartnerScreenHeader from '../components/partner/PartnerScreenHeader';
import {
  CarouselDot,
  FadeSlideIn,
} from '../components/ui/motion';
import {
  MotorRenewalPoster,
  HealthReportPoster,
} from '../components/grow/GrowVisuals';
import HtmlGrowCard, { GROW_CARD_RENDER_W } from '../components/grow/HtmlGrowCard';
import GrowPosterImage from '../components/grow/GrowPosterImage';
import { fetchGrowCardTemplates } from '../services/growCards';
import {
  buildTemplatePayload,
  fetchRecommendedTemplate,
  getSectionApiKey,
  type TemplateResult,
} from '../services/llmTemplateApi';
import { personalizeGrowTemplate, renderGrowCardHtml } from '../utils/growCardHtml';
import { captureGrowCardImage, shareGrowCard } from '../utils/shareGrowCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GREETING_CARD_W = 200;
const GREETING_SNAP = GREETING_CARD_W + 12;

interface Props {
  customers: Customer[];
  streakDay: number;
  onBack: () => void;
}

type SectionTab = 'renewal' | 'pitch' | 'health' | 'greetings';
type ModalKind = 'whatsapp' | 'download' | null;

interface ModalPayload {
  title: string;
  text: string;
  imageType: string;
  /** Raw HTML template from backend (still contains {MESSAGE}). */
  cardTemplateHtml?: string;
  cardId?: string;
}

const SECTIONS: { key: SectionTab; label: string; day: number | null; icon: keyof typeof Feather.glyphMap; id: number }[] = [
  { key: 'renewal', label: 'Renewal', day: 7, icon: 'clock', id: 1 },
  { key: 'pitch', label: 'Pitch', day: 21, icon: 'mic', id: 4 },
  { key: 'health', label: 'Health', day: 30, icon: 'activity', id: 3 },
  { key: 'greetings', label: 'Cards', day: null, icon: 'gift', id: 2 },
];

function personalize(template: string, customer: Customer) {
  return personalizeGrowTemplate(template, customer);
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.groupBox}>{children}</View>
    </View>
  );
}

function GroupRow({
  label,
  value,
  onPress,
  last,
  chevron,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  chevron?: boolean;
}) {
  const inner = (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {chevron ? <Feather name="chevron-right" size={16} color="#C7C7CC" /> : null}
      </View>
    </>
  );
  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[styles.groupRow, !last && styles.groupRowBorder]}>
        {inner}
      </PressableScale>
    );
  }
  return <View style={[styles.groupRow, !last && styles.groupRowBorder]}>{inner}</View>;
}

function Disclosure({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  return (
    <View style={styles.disclosure}>
      <Pressable onPress={toggle} style={styles.disclosureHead}>
        <View style={styles.disclosureHeadLeft}>
          <Text style={styles.disclosureTitle}>{title}</Text>
          {subtitle && !open ? <Text style={styles.disclosureSub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
      </Pressable>
      {open ? <View style={styles.disclosureBody}>{children}</View> : null}
    </View>
  );
}

function CompactNote({
  customerName,
  sectionKey,
  value,
  onChange,
}: {
  customerName: string;
  sectionKey: string;
  value: string;
  onChange: (key: string, text: string) => void;
}) {
  const [open, setOpen] = useState(!!value);
  const noteKey = `${customerName}_${sectionKey}`;
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  return (
    <Group title="Call Notes">
      <Pressable onPress={toggle} style={styles.noteToggle}>
        <Feather name="edit-3" size={15} color={colors.partner.accent} />
        <Text style={styles.noteToggleText}>
          {value ? 'Edit verbal feedback' : 'Add verbal feedback'}
        </Text>
        {value ? (
          <View style={styles.noteSavedDot}>
            <Feather name="check" size={10} color="#FFF" />
          </View>
        ) : null}
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#C7C7CC" />
      </Pressable>
      {open ? (
        <TextInput
          value={value}
          onChangeText={(t) => onChange(noteKey, t)}
          placeholder={`Notes from your call with ${customerName.split(' ')[0]}…`}
          placeholderTextColor="#AEAEB2"
          multiline
          style={styles.noteInput}
        />
      ) : null}
    </Group>
  );
}

function ActionBar({ onShare, onDownload }: { onShare: () => void; onDownload: () => void }) {
  return (
    <View style={styles.actionBar}>
      <PressableScale onPress={onShare} style={styles.actionPrimary} haptic>
        <Feather name="send" size={16} color="#FFF" />
        <Text style={styles.actionPrimaryText}>Share</Text>
      </PressableScale>
      <PressableScale onPress={onDownload} style={styles.actionSecondary} haptic>
        <Feather name="download" size={16} color={colors.partner.accent} />
        <Text style={styles.actionSecondaryText}>Save</Text>
      </PressableScale>
    </View>
  );
}

function SectionTabs({
  active,
  onChange,
  streakDay,
}: {
  active: SectionTab;
  onChange: (tab: SectionTab) => void;
  streakDay: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabRow}
      style={styles.tabScroll}
    >
      {SECTIONS.map((sec) => {
        const selected = active === sec.key;
        const locked = sec.day !== null && streakDay < sec.day;
        return (
          <PressableScale
            key={sec.key}
            onPress={() => {
              if (locked) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                return;
              }
              onChange(sec.key);
            }}
            style={[styles.tab, selected && styles.tabActive, locked && styles.tabLocked]}
            haptic={!locked}
          >
            <Feather
              name={locked ? 'lock' : sec.icon}
              size={13}
              color={selected ? colors.partner.accent : locked ? '#C7C7CC' : '#8E8E93'}
            />
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive, locked && styles.tabLabelLocked]}>
              {sec.label}
            </Text>
            {sec.day !== null ? (
              <Text style={[styles.tabDay, selected && styles.tabDayActive]}>D{sec.day}</Text>
            ) : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

export default function GrowScreen({ customers, streakDay, onBack }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeId, setActiveId] = useState(customers[0]?.customer_id ?? '');
  const [activeTab, setActiveTab] = useState<SectionTab>('renewal');
  const [completedPoints, setCompletedPoints] = useState<Record<number, boolean>>({});
  const [quickNotes, setQuickNotes] = useState<Record<string, string>>({});
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [modalPayload, setModalPayload] = useState<ModalPayload | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [growCards, setGrowCards] = useState<GrowCardTemplate[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [sharingCard, setSharingCard] = useState(false);
  const [shareDraftText, setShareDraftText] = useState('');
  const [captureHtml, setCaptureHtml] = useState<string | null>(null);
  const [templateCache, setTemplateCache] = useState<Record<string, TemplateResult>>({});
  const [templateLoadingKey, setTemplateLoadingKey] = useState<string | null>(null);
  const [templateErrors, setTemplateErrors] = useState<Record<string, string>>({});
  const greetingScrollRef = useRef<ScrollView>(null);
  const cardCaptureRef = useRef<ViewShot>(null);
  const captureReadyRef = useRef(false);

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((msg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast(msg);
  }, []);

  const customer = useMemo(
    () => customers.find((c) => c.customer_id === activeId) ?? customers[0],
    [customers, activeId]
  );

  const activeSection = useMemo(
    () => SECTIONS.find((sec) => sec.key === activeTab),
    [activeTab]
  );

  const templateCacheKey = useMemo(() => {
    if (!activeSection || getSectionApiKey(activeSection.id) === null) return null;
    return `${customer.customer_id}-${activeSection.id}`;
  }, [customer.customer_id, activeSection]);

  const activeTemplate = templateCacheKey ? templateCache[templateCacheKey] ?? null : null;
  const templateLoading = templateCacheKey !== null && templateLoadingKey === templateCacheKey;
  const templateError = templateCacheKey ? templateErrors[templateCacheKey] ?? null : null;

  const templateFetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeSection || !templateCacheKey) return;

    const apiKey = getSectionApiKey(activeSection.id);
    if (apiKey === null) return;
    if (templateFetchedRef.current.has(templateCacheKey)) return;

    const payload = buildTemplatePayload(activeSection.id, customer);
    if (!payload) return;

    let cancelled = false;
    setTemplateLoadingKey(templateCacheKey);
    setTemplateErrors((prev) => {
      const next = { ...prev };
      delete next[templateCacheKey];
      return next;
    });

    fetchRecommendedTemplate(payload)
      .then((result) => {
        if (cancelled) return;
        templateFetchedRef.current.add(templateCacheKey);
        setTemplateCache((prev) => ({ ...prev, [templateCacheKey]: result }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Could not load preview.';
        setTemplateErrors((prev) => ({ ...prev, [templateCacheKey]: message }));
      })
      .finally(() => {
        if (!cancelled) setTemplateLoadingKey(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSection, customer, templateCacheKey]);

  const { width: windowWidth } = useWindowDimensions();
  const greetingSideInset = Math.max(0, (windowWidth - GREETING_CARD_W) / 2);

  useEffect(() => {
    let cancelled = false;
    setCardsLoading(true);
    setCardsError(null);
    fetchGrowCardTemplates()
      .then((cards) => {
        if (!cancelled) setGrowCards(cards);
      })
      .catch(() => {
        if (!cancelled) setCardsError('Could not load greeting cards.');
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const personalizedCards = useMemo(
    () =>
      growCards.map((card) => {
        const shareText = personalize(card.shareMessageTemplate, customer);
        return {
          ...card,
          templateHtml: card.html,
          shareText,
          html: renderGrowCardHtml(card.html, customer, shareText),
        };
      }),
    [growCards, customer],
  );

  const modalCardHtml = useMemo(() => {
    if (!modalPayload?.cardTemplateHtml || modalKind !== 'whatsapp') return null;
    return renderGrowCardHtml(modalPayload.cardTemplateHtml, customer, shareDraftText);
  }, [modalPayload?.cardTemplateHtml, modalKind, customer, shareDraftText]);

  const pointsDone = Object.values(completedPoints).filter(Boolean).length;

  const selectCustomer = (id: string) => {
    setActiveId(id);
    setCompletedPoints({});
    templateFetchedRef.current.clear();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const switchTab = (tab: SectionTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const openShare = (title: string, template: string, imageType: string, cardTemplateHtml?: string, cardId?: string) => {
    const text = personalize(template, customer);
    setShareDraftText(text);
    setModalPayload({
      title,
      text,
      imageType,
      cardTemplateHtml,
      cardId,
    });
    setModalKind('whatsapp');
  };

  const openCardShare = (card: (typeof personalizedCards)[number]) => {
    openShare(card.title, card.shareMessageTemplate, card.id, card.templateHtml, card.id);
  };

  const openDownload = (title: string, imageType: string) => {
    setModalPayload({
      title,
      text: `High-resolution "${title}" for ${customer.name}.`,
      imageType,
    });
    setModalKind('download');
    setTimeout(() => showToast('Saved to downloads'), 900);
  };

  const dispatchShare = async () => {
    if (!modalPayload) return;
    const message = shareDraftText.trim();
    if (!message) {
      showToast('Add a message to share');
      return;
    }
    setSharingCard(true);
    try {
      if (modalPayload.cardTemplateHtml && modalPayload.cardId) {
        captureReadyRef.current = false;
        const finalHtml = renderGrowCardHtml(modalPayload.cardTemplateHtml, customer, message);
        setCaptureHtml(finalHtml);
        await waitForCardCapture();
        await new Promise((r) => setTimeout(r, 180));
        const uri = await captureGrowCardImage(cardCaptureRef, modalPayload.cardId);
        await shareGrowCard(uri, message);
      } else {
        await Share.share({ message });
      }
    } catch {
      showToast('Share cancelled');
    } finally {
      setSharingCard(false);
      setCaptureHtml(null);
      setModalKind(null);
    }
  };

  const copyPreview = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch {
      /* cancelled */
    }
  };

  const onGreetingScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / GREETING_SNAP);
    const max = Math.max(0, personalizedCards.length - 1);
    setGreetingIndex(Math.min(max, Math.max(0, idx)));
  };

  const waitForCardCapture = () =>
    new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        if (captureReadyRef.current) {
          resolve();
          return;
        }
        if (Date.now() - started > 4000) {
          reject(new Error('Card render timed out'));
          return;
        }
        setTimeout(poll, 60);
      };
      setTimeout(poll, 100);
    });

  const talkingPoints = [
    `Motor renews in ${customer.renewsInDays} days — lock in the premium rate early.`,
    `Protection gap: motor & life covered, health shield is weak.`,
    `Consolidating health now unlocks 5% multi-policy discount.`,
  ];

  const renderGreetings = () => {
    if (cardsLoading) {
      return (
        <View style={styles.cardsLoading}>
          <ActivityIndicator color={colors.partner.accent} />
          <Text style={styles.cardsLoadingText}>Loading cards…</Text>
        </View>
      );
    }

    if (cardsError || personalizedCards.length === 0) {
      return (
        <View style={styles.cardsLoading}>
          <Feather name="alert-circle" size={20} color={colors.text.tertiary} />
          <Text style={styles.cardsLoadingText}>{cardsError ?? 'No cards available.'}</Text>
        </View>
      );
    }

    const isSingleCard = personalizedCards.length === 1;

    const cardTile = (
      card: (typeof personalizedCards)[number],
      width: number,
      last: boolean,
      spaced: boolean,
    ) => (
      <PressableScale
        key={card.id}
        onPress={() => openCardShare(card)}
        style={[styles.greetingWrap, spaced && !last && styles.greetingWrapSpaced]}
        haptic
      >
        <HtmlGrowCard html={card.html} width={width} />
        <View style={styles.greetingOverlay}>
          <Feather name="send" size={14} color="#FFF" />
          <Text style={styles.greetingOverlayText}>Tap to share</Text>
        </View>
      </PressableScale>
    );

    const cardsRowWidth =
      personalizedCards.length * GREETING_CARD_W + (personalizedCards.length - 1) * 12;
    const cardsFitOnScreen = cardsRowWidth <= windowWidth;

    return (
      <FadeSlideIn index={0} key={`greetings-${customer.customer_id}`}>
        {activeTemplate?.posterImage?.dataBase64 ? (
          <View style={styles.greetingApiPreview}>
            <Text style={styles.groupTitle}>AI Card Preview</Text>
            <GrowPosterImage
              dataBase64={activeTemplate.posterImage.dataBase64}
              mimeType={activeTemplate.posterImage.mimeType}
              width={GREETING_CARD_W}
            />
          </View>
        ) : templateLoading ? (
          <View style={styles.cardsLoading}>
            <ActivityIndicator color={colors.partner.accent} />
            <Text style={styles.cardsLoadingText}>Generating card…</Text>
          </View>
        ) : null}
        <View style={styles.greetingCarousel}>
        {isSingleCard ? (
          <View style={styles.greetingSingle}>
            {cardTile(personalizedCards[0], GREETING_CARD_W, true, false)}
          </View>
        ) : cardsFitOnScreen ? (
          <View style={styles.greetingRow}>
            {personalizedCards.map((card, i) =>
              cardTile(card, GREETING_CARD_W, i === personalizedCards.length - 1, false),
            )}
          </View>
        ) : (
          <ScrollView
            ref={greetingScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={GREETING_SNAP}
            snapToAlignment="center"
            onScroll={onGreetingScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.greetingScroll,
              { paddingHorizontal: greetingSideInset },
            ]}
          >
            {personalizedCards.map((card, i) =>
              cardTile(card, GREETING_CARD_W, i === personalizedCards.length - 1, true),
            )}
          </ScrollView>
        )}
        {!isSingleCard && !cardsFitOnScreen ? (
        <View style={styles.dotRow}>
          {personalizedCards.map((_, i) => (
            <CarouselDot
              key={i}
              active={greetingIndex === i}
              activeColor={colors.partner.accent}
              inactiveColor="#D1D1D6"
            />
          ))}
        </View>
        ) : null}
        </View>
        <Group title="Templates">
          {personalizedCards.map((card, i) => (
            <GroupRow
              key={card.id}
              label={card.title}
              chevron
              last={i === personalizedCards.length - 1}
              onPress={() => {
                greetingScrollRef.current?.scrollTo({ x: i * GREETING_SNAP, animated: true });
                openCardShare(card);
              }}
            />
          ))}
        </Group>
        <CompactNote
          customerName={customer.name}
          sectionKey="greetings"
          value={quickNotes[`${customer.name}_greetings`] ?? ''}
          onChange={(k, t) => setQuickNotes((p) => ({ ...p, [k]: t }))}
        />
      </FadeSlideIn>
    );
  };

  const renderRenewal = () => (
    <FadeSlideIn index={0} key={`renewal-${customer.customer_id}`}>
      <MotorRenewalPoster
        customerName={customer.name}
        motorDaysLeft={customer.renewsInDays}
        protectionScore={customer.protection_intelligence_score}
      />
      <Group title="Message Preview">
        <View style={styles.previewBlock}>
          <Text style={styles.previewText}>
            Hi {customer.name.split(' ')[0]}, your motor policy is due in {customer.renewsInDays} days. Let's ensure
            zero break-in risk. Safe driving! 🚗
          </Text>
          <PressableScale
            onPress={() =>
              copyPreview(
                `Hi ${customer.name}, your motor policy is due in ${customer.renewsInDays} days! Let's ensure zero break-in risk. Safe driving! 🚗`
              )
            }
            style={styles.copyChip}
            haptic
          >
            <Feather name="copy" size={12} color={colors.partner.accent} />
            <Text style={styles.copyChipText}>Copy</Text>
          </PressableScale>
        </View>
      </Group>
      <ActionBar
        onShare={() =>
          openShare(
            'Renewal Reminder',
            "Hi {NAME}, your motor policy is due in {DAYS} days! Let's ensure zero break-in risk. Safe driving! 🚗",
            'motor'
          )
        }
        onDownload={() => openDownload('Renewal Reminder', 'motor')}
      />
      <CompactNote
        customerName={customer.name}
        sectionKey="renewal"
        value={quickNotes[`${customer.name}_renewal`] ?? ''}
        onChange={(k, t) => setQuickNotes((p) => ({ ...p, [k]: t }))}
      />
    </FadeSlideIn>
  );

  const renderPitch = () => (
    <FadeSlideIn index={0} key={`pitch-${customer.customer_id}`}>
      <GrowPosterImage
        loading={templateLoading}
        error={templateError}
        dataBase64={activeTemplate?.posterImage?.dataBase64}
        mimeType={activeTemplate?.posterImage?.mimeType}
        fallback={
          <HealthReportPoster
            customerName={customer.name}
            motorDaysLeft={customer.renewsInDays}
            protectionScore={customer.protection_intelligence_score}
          />
        }
      />
      <View style={styles.pitchHeader}>
        <View style={styles.pitchBadge}>
          <Feather name="lock" size={11} color="#8E8E93" />
          <Text style={styles.pitchBadgeText}>Private script</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{pointsDone}/3 points</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(pointsDone / 3) * 100}%` }]} />
          </View>
        </View>
      </View>

      <Disclosure title="Opening" subtitle={`Hi ${customer.name.split(' ')[0]}…`} defaultOpen>
        <Text style={styles.scriptText}>
          "Hi {customer.name}, I was reviewing your policies ahead of your motor renewal in{' '}
          <Text style={styles.scriptBold}>{customer.renewsInDays} days</Text>. Congratulations on your excellent risk
          score! Can we make your safety net complete this year?"
        </Text>
      </Disclosure>

      <View style={styles.pointsGroup}>
        <Text style={styles.pointsLabel}>Talking Points</Text>
        {talkingPoints.map((pt, idx) => {
          const done = !!completedPoints[idx];
          return (
            <PressableScale
              key={idx}
              onPress={() => setCompletedPoints((p) => ({ ...p, [idx]: !p[idx] }))}
              style={[styles.pointRow, done && styles.pointRowDone]}
              haptic
            >
              <View style={[styles.pointCircle, done && styles.pointCircleDone]}>
                {done ? <Feather name="check" size={11} color="#FFF" /> : null}
              </View>
              <Text style={[styles.pointText, done && styles.pointTextDone]}>{pt}</Text>
            </PressableScale>
          );
        })}
        {pointsDone === 3 ? (
          <View style={styles.pointsDoneBanner}>
            <Feather name="zap" size={14} color={colors.customerGreen} />
            <Text style={styles.pointsDoneText}>Pitch path complete</Text>
          </View>
        ) : null}
      </View>

      <Disclosure title="If client pushes back">
        <Text style={styles.scriptText}>
          "I understand budget is a consideration, {customer.name.split(' ')[0]}. An unexpected medical event can
          impact savings far more than a small monthly premium…"
        </Text>
      </Disclosure>

      <Disclosure title="Closing">
        <Text style={styles.scriptText}>
          "Shall I send a quick comparison of the top two affordable health plans? Two minutes to review."
        </Text>
      </Disclosure>

      <CompactNote
        customerName={customer.name}
        sectionKey="pitch"
        value={quickNotes[`${customer.name}_pitch`] ?? ''}
        onChange={(k, t) => setQuickNotes((p) => ({ ...p, [k]: t }))}
      />
    </FadeSlideIn>
  );

  const renderHealth = () => {
    const previewCaption =
      activeTemplate?.content.caption ??
      `Hi ${customer.name.split(' ')[0]}, your Protection Wellness report is ready — rating ${customer.protection_intelligence_score}%. Let's review two gap solutions today. 📊`;

    return (
    <FadeSlideIn index={0} key={`health-${customer.customer_id}`}>
      <GrowPosterImage
        loading={templateLoading}
        error={templateError}
        dataBase64={activeTemplate?.posterImage?.dataBase64}
        mimeType={activeTemplate?.posterImage?.mimeType}
        fallback={
          <HealthReportPoster
            customerName={customer.name}
            motorDaysLeft={customer.renewsInDays}
            protectionScore={customer.protection_intelligence_score}
          />
        }
      />
      <Group title="Message Preview">
        <View style={styles.previewBlock}>
          <Text style={styles.previewText}>{previewCaption}</Text>
          <PressableScale
            onPress={() => copyPreview(previewCaption)}
            style={styles.copyChip}
            haptic
          >
            <Feather name="copy" size={12} color={colors.partner.accent} />
            <Text style={styles.copyChipText}>Copy</Text>
          </PressableScale>
        </View>
      </Group>
      <ActionBar
        onShare={() =>
          openShare(
            'Policy Health Report',
            activeTemplate?.content.caption ??
              "Hi {NAME}, your Protection Wellness report is ready! Rating: {SCORE}%. Let's review gap solutions today. 📊",
            'report'
          )
        }
        onDownload={() => openDownload('Policy Health Report', 'report')}
      />
      <CompactNote
        customerName={customer.name}
        sectionKey="report"
        value={quickNotes[`${customer.name}_report`] ?? ''}
        onChange={(k, t) => setQuickNotes((p) => ({ ...p, [k]: t }))}
      />
    </FadeSlideIn>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'renewal':
        return renderRenewal();
      case 'pitch':
        return renderPitch();
      case 'health':
        return renderHealth();
      case 'greetings':
        return renderGreetings();
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        nestedScrollEnabled
      >
        <PartnerScreenHeader
          onBack={onBack}
          compact
          center={<Text style={styles.growTitle}>Grow</Text>}
        >
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={[styles.avatarScroll, { width: screenWidth, marginLeft: -space[5] }]}
            contentContainerStyle={styles.avatarRow}
            keyboardShouldPersistTaps="handled"
          >
            {customers.map((c) => {
              const active = c.customer_id === customer.customer_id;
              return (
                <PressableScale
                  key={c.customer_id}
                  onPress={() => selectCustomer(c.customer_id)}
                  style={styles.avatarBtn}
                  haptic
                >
                  <LinearGradient
                    colors={active ? [c.avatarColors[0], c.avatarColors[1]] : ['#E5E5EA', '#D1D1D6']}
                    style={[styles.avatarCircle, active && styles.avatarCircleActive]}
                  >
                    <Text style={[styles.avatarInitials, !active && styles.avatarInitialsMuted]}>{c.initials}</Text>
                  </LinearGradient>
                  <Text style={[styles.avatarName, active && styles.avatarNameActive]} numberOfLines={1}>
                    {c.name.split(' ')[0]}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </PartnerScreenHeader>

        <View style={styles.stickyTabs}>
          <SectionTabs active={activeTab} onChange={switchTab} streakDay={streakDay} />
        </View>

        <View style={styles.sectionBody}>{renderContent()}</View>

        <Text style={styles.footer}>More unlocks as your streak grows.</Text>
      </ScrollView>

      <Toast message={toast} onHide={dismissToast} bottom={96} variant="green" />

      <Modal visible={modalKind === 'whatsapp'} transparent animationType="slide" onRequestClose={() => setModalKind(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalKind(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Share via WhatsApp</Text>
            <Text style={styles.sheetSub}>To {customer.name}</Text>
            {modalCardHtml ? (
              <View style={styles.sheetCardPreview}>
                <HtmlGrowCard key={shareDraftText} html={modalCardHtml} width={160} />
              </View>
            ) : null}
            <Text style={styles.bubbleLabel}>Message</Text>
            <View style={styles.bubble}>
              <TextInput
                style={styles.bubbleInput}
                value={shareDraftText}
                onChangeText={setShareDraftText}
                multiline
                scrollEnabled={false}
                placeholder="Write your message…"
                placeholderTextColor={colors.text.tertiary}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.sheetMeta}>
              <Feather name="paperclip" size={14} color={colors.customerGreen} />
              <Text style={styles.sheetMetaText}>
                {modalPayload?.cardTemplateHtml
                  ? `${modalPayload.imageType.toUpperCase()} card attached`
                  : `${modalPayload?.imageType?.toUpperCase()} poster attached`}
              </Text>
            </View>
            <PressableScale
              onPress={dispatchShare}
              style={[styles.sheetPrimary, sharingCard && styles.sheetPrimaryDisabled]}
              haptic
              disabled={sharingCard}
            >
              {sharingCard ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Feather name="send" size={16} color="#FFF" />
              )}
              <Text style={styles.sheetPrimaryText}>{sharingCard ? 'Preparing…' : 'Send Message'}</Text>
            </PressableScale>
            <Pressable onPress={() => setModalKind(null)} style={styles.sheetCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={modalKind === 'download'} transparent animationType="fade" onRequestClose={() => setModalKind(null)}>
        <View style={styles.modalBackdropCenter}>
          <View style={styles.downloadSheet}>
            <View style={styles.downloadIcon}>
              <Feather name="check" size={22} color={colors.customerGreen} />
            </View>
            <Text style={styles.downloadTitle}>Saved</Text>
            <Text style={styles.downloadSub}>{modalPayload?.text}</Text>
            <PressableScale onPress={() => setModalKind(null)} style={styles.sheetPrimary} haptic>
              <Text style={styles.sheetPrimaryText}>Done</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>

      {captureHtml ? (
        <View style={styles.captureHost} pointerEvents="none" collapsable={false}>
          <HtmlGrowCard
            html={captureHtml}
            width={GROW_CARD_RENDER_W}
            captureRef={cardCaptureRef}
            onReady={() => {
              captureReadyRef.current = true;
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { flex: 1 },
  content: { paddingBottom: 110 },

  growTitle: {
    ...typeScale.title,
    color: colors.text.inverse,
  },

  avatarScroll: {
    flexGrow: 0,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    paddingHorizontal: space[5],
    paddingTop: space[2],
    paddingBottom: space[1],
    paddingRight: space[6],
  },
  avatarBtn: { alignItems: 'center', width: 52, flexShrink: 0 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCircleActive: {
    borderColor: '#FFF',
    ...shadows.card,
  },
  avatarInitials: { fontFamily: fonts.headingExtra, fontSize: 13, color: '#FFF' },
  avatarInitialsMuted: { color: '#8E8E93' },
  avatarName: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.inverseMuted,
    marginTop: 3,
    maxWidth: 52,
    textAlign: 'center',
  },
  avatarNameActive: { fontFamily: fonts.bodyBold, color: colors.text.inverse },

  stickyTabs: {
    backgroundColor: '#F2F2F7',
    paddingTop: space[2],
    paddingBottom: space[1],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  tabScroll: { flexGrow: 0 },
  tabRow: { paddingHorizontal: space[4], gap: space[2] },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  tabActive: {
    backgroundColor: colors.partner.accentSoft,
    borderColor: 'rgba(37,99,235,0.25)',
  },
  tabLocked: { opacity: 0.55 },
  tabLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: '#8E8E93' },
  tabLabelActive: { color: colors.partner.accent, fontFamily: fonts.bodyBold },
  tabLabelLocked: { color: '#C7C7CC' },
  tabDay: { fontFamily: fonts.body, fontSize: 9, color: '#AEAEB2', marginLeft: 2 },
  tabDayActive: { color: colors.partner.accent },

  sectionBody: { paddingHorizontal: space[4], paddingTop: space[3], gap: space[3] },

  group: { marginTop: space[2] },
  groupTitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: space[1],
    marginLeft: space[1],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupBox: {
    backgroundColor: '#FFF',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: space[4],
    minHeight: 44,
  },
  groupRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.text.primary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontFamily: fonts.body, fontSize: 15, color: '#8E8E93' },

  previewBlock: { padding: space[3] },
  previewText: { fontFamily: fonts.body, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: space[2],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.partner.accentSoft,
  },
  copyChipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.partner.accent },

  actionBar: { flexDirection: 'row', gap: space[2], marginTop: space[1] },
  actionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.customerGreen,
    borderRadius: radius.md,
    paddingVertical: 12,
    minHeight: 44,
  },
  actionPrimaryText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#FFF' },
  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    borderRadius: radius.md,
    paddingVertical: 12,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  actionSecondaryText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.partner.accent },

  pitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[1],
  },
  pitchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  pitchBadgeText: { fontFamily: fonts.body, fontSize: 11, color: '#8E8E93' },
  progressPill: { alignItems: 'flex-end', gap: 4 },
  progressText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.partner.accent },
  progressTrack: {
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.partner.accent, borderRadius: 2 },

  disclosure: {
    backgroundColor: '#FFF',
    borderRadius: radius.md,
    marginTop: space[2],
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  disclosureHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: 12,
    minHeight: 44,
  },
  disclosureHeadLeft: { flex: 1, marginRight: space[2] },
  disclosureTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text.primary },
  disclosureSub: { fontFamily: fonts.body, fontSize: 13, color: '#8E8E93', marginTop: 2 },
  disclosureBody: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  scriptText: { fontFamily: fonts.body, fontSize: 14, color: colors.text.secondary, lineHeight: 21, fontStyle: 'italic' },
  scriptBold: { fontFamily: fonts.bodyBold, color: colors.text.primary, fontStyle: 'normal' },

  pointsGroup: {
    backgroundColor: '#FFF',
    borderRadius: radius.md,
    marginTop: space[2],
    padding: space[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  pointsLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: space[2],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingVertical: 8,
    paddingHorizontal: space[1],
    borderRadius: radius.sm,
  },
  pointRowDone: { backgroundColor: 'rgba(37,99,235,0.04)' },
  pointCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.partner.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointCircleDone: { backgroundColor: colors.partner.accent, borderColor: colors.partner.accent },
  pointText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text.primary, lineHeight: 20 },
  pointTextDone: { color: '#8E8E93', textDecorationLine: 'line-through' },
  pointsDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space[2],
    padding: space[2],
    backgroundColor: colors.customer.accentSoft,
    borderRadius: radius.sm,
  },
  pointsDoneText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.customerGreenDark },

  noteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: 12,
    minHeight: 44,
  },
  noteToggleText: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.partner.accent },
  noteSavedDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.customerGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInput: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: 72,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },

  greetingCarousel: {
    width: '100%',
  },
  greetingApiPreview: {
    marginBottom: space[3],
    alignItems: 'center',
  },
  greetingScroll: {
    paddingVertical: space[1],
    alignItems: 'center',
  },
  greetingSingle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: space[1],
  },
  greetingRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: space[1],
    gap: 12,
  },
  greetingWrap: { position: 'relative' },
  greetingWrapSpaced: { marginRight: 12 },
  cardsLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[8],
    gap: space[2],
  },
  cardsLoadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.tertiary,
  },
  captureHost: {
    position: 'absolute',
    left: -5000,
    top: 0,
    opacity: 0.02,
  },
  sheetCardPreview: {
    alignItems: 'center',
    marginBottom: space[3],
  },
  sheetPrimaryDisabled: { opacity: 0.75 },
  greetingOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  greetingOverlayText: { fontFamily: fonts.bodySemi, fontSize: 10, color: '#FFF' },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: space[1],
    marginBottom: space[2],
  },

  footer: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#AEAEB2',
    marginTop: space[5],
    marginHorizontal: space[6],
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'flex-end',
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'center',
    paddingHorizontal: space[5],
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[5],
    paddingBottom: space[6],
    paddingTop: space[2],
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
    alignSelf: 'center',
    marginBottom: space[4],
  },
  sheetTitle: { ...typeScale.heading, color: colors.text.primary },
  sheetSub: { ...typeScale.caption, color: colors.text.tertiary, marginTop: 2, marginBottom: space[4] },
  bubble: {
    backgroundColor: '#E9E9EB',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: space[3],
    marginBottom: space[3],
    minHeight: 88,
  },
  bubbleLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: space[1],
  },
  bubbleInput: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    minHeight: 72,
    padding: 0,
  },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space[4] },
  sheetMetaText: { fontFamily: fonts.body, fontSize: 13, color: colors.customerGreen },
  sheetPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.customerGreen,
    borderRadius: radius.md,
    paddingVertical: 14,
    minHeight: 50,
  },
  sheetPrimaryText: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#FFF' },
  sheetCancel: { alignItems: 'center', paddingVertical: space[3], marginTop: space[1] },
  sheetCancelText: { fontFamily: fonts.body, fontSize: 16, color: colors.partner.accent },

  downloadSheet: {
    backgroundColor: '#FFF',
    borderRadius: radius.xl,
    padding: space[5],
    alignItems: 'center',
  },
  downloadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.customer.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[3],
  },
  downloadTitle: { ...typeScale.heading, color: colors.text.primary, marginBottom: space[1] },
  downloadSub: {
    ...typeScale.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: space[4],
    lineHeight: 18,
  },
});
