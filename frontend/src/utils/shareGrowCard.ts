import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import type ViewShot from 'react-native-view-shot';
import type { RefObject } from 'react';

export async function captureGrowCardImage(
  ref: RefObject<ViewShot | null>,
  cardId: string,
): Promise<string> {
  if (!ref.current) {
    throw new Error('Card capture ref is not ready');
  }

  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  const dir = `${FileSystem.cacheDirectory}grow-cards/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${cardId}-${Date.now()}.png`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function shareGrowCard(
  imageUri: string,
  message: string,
): Promise<void> {
  const canShareFile = await Sharing.isAvailableAsync();

  if (canShareFile) {
    if (Platform.OS === 'ios') {
      await Share.share({ message, url: imageUri });
      return;
    }
    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: 'Share card',
      UTI: 'public.png',
    });
    return;
  }

  await Share.share({ message });
}
