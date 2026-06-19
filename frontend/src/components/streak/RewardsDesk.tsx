import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows, radius, space, type as typeScale, touch } from '../../theme';
import PressableScale from '../ui/PressableScale';
import { FloatView, LiveDot, PulseScale, WiggleView } from '../ui/motion';
import CoinInline from '../ui/CoinInline';
import CoinIcon from '../ui/CoinIcon';

interface Badge {
  id: string;
  name: string;
  day: string;
  emoji: string;
  earned: boolean;
  description: string;
}

interface Props {
  coins: number;
  hasBooked: boolean;
  onUpdateCoins: (amount: number) => void;
  onSelectBadge: (badge: Badge) => void;
  onToast: (msg: string) => void;
}

const BADGES: Omit<Badge, 'earned'>[] = [
  { id: 'fast', name: 'Fast Starter', day: '3 Days', emoji: '⚡', description: 'First milestone of streak dedication. Keep the momentum going!' },
  { id: 'weekly', name: 'Weekly Warrior', day: '7 Days', emoji: '🏆', description: 'Consecutive days of supreme sales outreach dedication.' },
  { id: 'sentinel', name: 'Streak Sentinel', day: '14 Days', emoji: '🛡️', description: 'Elite protector of active client opportunities.' },
  { id: 'monthly', name: 'Monthly Master', day: '30 Days', emoji: '👑', description: 'Legendary agent tier with maximum metrics and active protection.' },
];

type RewardsTab = 'trophies' | 'shareables' | 'safeguards';

export default function RewardsDesk({ coins, hasBooked, onUpdateCoins, onSelectBadge, onToast }: Props) {
  const [tab, setTab] = useState<RewardsTab>('trophies');
  const [frostProtected, setFrostProtected] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);

  const badges: Badge[] = BADGES.map((b) => ({
    ...b,
    earned: b.id === 'monthly' ? hasBooked : true,
  }));

  const handleBuySafeguard = () => {
    if (coins < 150) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onToast(`Insufficient coins. You need 150 coins, but have ${coins}.`);
      return;
    }
    setFreezeModalOpen(true);
  };

  const confirmFreeze = () => {
    setFreezeModalOpen(false);
    setFrostProtected(true);
    onUpdateCoins(-150);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onToast('Streak Freeze Shield is now active and protected.');
  };

  const renderBadge = (b: Badge) => (
    <View key={b.id} style={styles.badgeCell}>
      <PressableScale
        style={[styles.badgeCard, !b.earned && styles.badgeLocked]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelectBadge(b);
          if (!b.earned) onToast(`Previewing locked badge "${b.name}". Keep up your streak to claim!`);
        }}
      >
        {b.earned ? (
          <View style={styles.earnedDot}>
            <LiveDot color={colors.status.success} size={6} />
          </View>
        ) : (
          <View style={styles.lockDot}><Text style={styles.lockIcon}>🔒</Text></View>
        )}
        {b.earned ? (
          <FloatView delay={b.id === 'fast' ? 0 : b.id === 'weekly' ? 200 : b.id === 'sentinel' ? 400 : 600} distance={3}>
            <WiggleView angle={4} duration={3200} delay={100}>
              <Text style={styles.badgeEmoji}>{b.emoji}</Text>
            </WiggleView>
          </FloatView>
        ) : (
          <Text style={[styles.badgeEmoji, styles.badgeEmojiLocked]}>{b.emoji}</Text>
        )}
        <Text style={styles.badgeName} numberOfLines={2}>{b.name}</Text>
        <Text style={styles.badgeDay}>{b.day} Goal</Text>
      </PressableScale>
    </View>
  );

  return (
    <View style={[styles.card, shadows.card]}>
      <Text style={styles.title}>Rewards desk & streak shop</Text>
      <Text style={styles.sub}>Tappable milestones, shareable cards, and status safeguards</Text>

      <View style={styles.tabs}>
        {(['trophies', 'shareables', 'safeguards'] as RewardsTab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'trophies' ? 'Trophies' : t === 'shareables' ? 'Shareables' : 'Freeze Shop'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.content}>
        {tab === 'trophies' && (
          <View style={styles.badgeGrid}>
            <View style={styles.badgeRow}>
              {renderBadge(badges[0])}
              {renderBadge(badges[1])}
            </View>
            <View style={styles.badgeRow}>
              {renderBadge(badges[2])}
              {renderBadge(badges[3])}
            </View>
          </View>
        )}

        {tab === 'shareables' && (
          <View style={styles.shareGrid}>
            {[
              { name: 'Expert Voice', sub: 'Posts in your name', lock: 'D60', emoji: '🎙️' },
              { name: 'Seasonal Campaigns', sub: 'Festive & tax', lock: 'D100', emoji: '📅' },
            ].map((item) => (
              <PressableScale
                key={item.name}
                style={styles.shareCard}
                onPress={() => onToast(`Dispatched: ${item.name} unlocks under ${item.lock} streak goals.`)}
              >
                <View style={styles.shareLock}><Text style={styles.shareLockText}>🔒 {item.lock}</Text></View>
                <Text style={styles.shareEmoji}>{item.emoji}</Text>
                <Text style={styles.shareName}>{item.name}</Text>
                <Text style={styles.shareSub}>{item.sub}</Text>
              </PressableScale>
            ))}
          </View>
        )}

        {tab === 'safeguards' && (
          <View style={styles.safeguardWrap}>
            <View style={styles.balanceBar}>
              <View>
                <Text style={styles.balanceLabel}>Loyalty Balance</Text>
                <CoinInline
                  amount={coins}
                  suffix="Coins"
                  size="sm"
                  float
                  textStyle={styles.balanceCoins}
                />
              </View>
                <FloatView distance={3}>
                  <Text style={styles.trophy}>🏆</Text>
                </FloatView>
            </View>
            <View style={styles.freezeCard}>
                <View style={styles.freezeRow}>
                <PulseScale min={1} max={1.06} duration={2000}>
                  <View style={styles.freezeIcon}><Text>🛡️</Text></View>
                </PulseScale>
                <View style={styles.freezeInfo}>
                  <Text style={styles.freezeTitle}>Streak Freeze Shield</Text>
                  <Text style={styles.freezeDesc}>
                    Deducts 150 loyalty coins to freeze your streak for tomorrow.
                  </Text>
                </View>
                {frostProtected ? (
                  <PulseScale min={1} max={1.05} duration={1200}>
                    <View style={styles.activeChip}><Text style={styles.activeText}>ACTIVE</Text></View>
                  </PulseScale>
                ) : (
                  <Pressable onPress={handleBuySafeguard} style={styles.buyBtn}>
                    <View style={styles.buyCoinRow}>
                      <CoinIcon size="xs" />
                      <Text style={styles.buyText}>150 Coins</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {freezeModalOpen && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Buy streak freeze?</Text>
              <Text style={styles.modalBody}>
                This deducts 150 coins to protect your cadence even if you miss a mission tomorrow.
              </Text>
              <View style={styles.modalActions}>
                <Pressable onPress={() => setFreezeModalOpen(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmFreeze} style={styles.confirmBtn}>
                  <Text style={styles.confirmText}>Freeze (+150 coins)</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: space[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: space[8],
    ...shadows.card,
  },
  title: { ...typeScale.heading, color: colors.text.primary },
  sub: { ...typeScale.bodySm, color: colors.text.secondary, marginTop: space[1], marginBottom: space[4] },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface.canvas,
    borderRadius: radius.md,
    padding: space[1],
    marginBottom: space[4],
    gap: space[1],
  },
  tabBtn: { flex: 1, paddingVertical: space[2], borderRadius: radius.sm, alignItems: 'center', minHeight: 36 },
  tabBtnActive: { backgroundColor: colors.text.primary },
  tabText: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.text.secondary },
  tabTextActive: { color: colors.text.inverse },
  content: { minHeight: 200 },
  badgeGrid: { gap: space[3] },
  badgeRow: { flexDirection: 'row', gap: space[3], alignItems: 'stretch' },
  badgeCell: { flex: 1 },
  badgeCard: {
    width: '100%',
    minHeight: 140,
    backgroundColor: colors.surface.canvas,
    borderRadius: radius.lg,
    padding: space[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    position: 'relative',
  },
  badgeLocked: { opacity: 0.45 },
  earnedDot: {
    position: 'absolute',
    top: space[1],
    right: space[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.text.inverse, fontSize: 10, fontWeight: '800' },
  lockDot: { position: 'absolute', top: space[2], right: space[2] },
  lockIcon: { fontSize: 12 },
  badgeEmoji: { fontSize: 32, marginBottom: space[2] },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeName: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary, textAlign: 'center', lineHeight: 18 },
  badgeDay: { ...typeScale.label, color: colors.text.tertiary, fontSize: 10, marginTop: space[1] },
  shareGrid: { flexDirection: 'row', gap: space[3] },
  shareCard: {
    flex: 1,
    backgroundColor: colors.surface.canvas,
    borderRadius: radius.lg,
    padding: space[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minHeight: 148,
  },
  shareLock: {
    alignSelf: 'flex-end',
    backgroundColor: colors.partner.accentSoft,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    marginBottom: space[2],
  },
  shareLockText: { fontFamily: fonts.bodyBold, fontSize: typeScale.caption.fontSize, color: colors.partner.accent },
  shareEmoji: { fontSize: 28, marginBottom: space[2] },
  shareName: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary, textAlign: 'center' },
  shareSub: { ...typeScale.caption, color: colors.text.secondary, marginTop: space[1], textAlign: 'center' },
  safeguardWrap: { gap: space[2] },
  balanceBar: {
    backgroundColor: '#091D55',
    borderRadius: radius.md,
    padding: space[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { ...typeScale.label, color: '#B4C6FC', fontSize: 10 },
  balanceCoins: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.goldLight, marginTop: 2 },
  trophy: { fontSize: 20 },
  freezeCard: {
    backgroundColor: colors.surface.canvas,
    borderRadius: radius.md,
    padding: space[3],
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  freezeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  freezeIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.partner.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeInfo: { flex: 1 },
  freezeTitle: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.text.primary },
  freezeDesc: { ...typeScale.caption, color: colors.text.secondary, marginTop: space[1], lineHeight: 16 },
  activeChip: { backgroundColor: '#BAE6FD', paddingHorizontal: space[2], paddingVertical: space[1], borderRadius: radius.sm },
  activeText: { ...typeScale.label, color: '#0369A1', fontSize: 10 },
  buyBtn: {
    backgroundColor: colors.text.primary,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  buyText: { fontFamily: fonts.headingExtra, fontSize: typeScale.caption.fontSize, color: colors.text.inverse },
  buyCoinRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[5],
  },
  modal: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: space[5],
    width: '100%',
    maxWidth: 320,
    ...shadows.cardLifted,
  },
  modalTitle: { ...typeScale.heading, color: colors.text.primary, textAlign: 'center' },
  modalBody: { ...typeScale.bodySm, color: colors.text.secondary, textAlign: 'center', marginTop: space[2], marginBottom: space[4] },
  modalActions: { flexDirection: 'row', gap: space[2] },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface.canvas,
    minHeight: touch.min,
    justifyContent: 'center',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelText: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.text.secondary },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.partner.accent,
    minHeight: touch.min,
    justifyContent: 'center',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  confirmText: { fontFamily: fonts.headingExtra, fontSize: typeScale.bodySm.fontSize, color: colors.text.inverse },
});
