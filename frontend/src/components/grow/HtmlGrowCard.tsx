import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import ViewShot from 'react-native-view-shot';
import { radius } from '../../theme';

export const GROW_CARD_RENDER_W = 1080;
export const GROW_CARD_RENDER_H = 1080;

interface Props {
  html: string;
  /** Display width — height scales to keep aspect ratio. */
  width?: number;
  /** When set, enables high-res capture via ViewShot. */
  captureRef?: React.RefObject<ViewShot | null>;
  onReady?: () => void;
}

export default function HtmlGrowCard({
  html,
  width = 200,
  captureRef,
  onReady,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const height = useMemo(() => Math.round((width / GROW_CARD_RENDER_W) * GROW_CARD_RENDER_H), [width]);

  const handleLoadEnd = useCallback(() => {
    setLoaded(true);
    onReady?.();
  }, [onReady]);

  const scale = width / GROW_CARD_RENDER_W;
  const scaledHtml = useMemo(() => {
    const scaleStr = scale.toFixed(4);
    if (/width=device-width/i.test(html)) {
      return html.replace(
        /content="width=device-width, initial-scale=[^"]+"/i,
        `content="width=${GROW_CARD_RENDER_W}, initial-scale=${scaleStr}, maximum-scale=${scaleStr}, user-scalable=no"`,
      );
    }
    return html.replace(/initial-scale=[^,"']+/i, `initial-scale=${scaleStr}`);
  }, [html, scale]);

  const webView = (
    <View style={[styles.viewport, { width, height }]}>
      {!loaded ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#94A3B8" />
        </View>
      ) : null}
      <WebView
        key={scaledHtml}
        originWhitelist={['*']}
        source={{ html: scaledHtml }}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ width, height, backgroundColor: 'transparent' }}
        onLoadEnd={handleLoadEnd}
        collapsable={false}
        androidLayerType={Platform.OS === 'android' ? 'software' : undefined}
      />
    </View>
  );

  if (captureRef) {
    return (
      <ViewShot ref={captureRef} options={{ format: 'png', quality: 1 }} style={{ width, height }}>
        {webView}
      </ViewShot>
    );
  }

  return webView;
}

const styles = StyleSheet.create({
  viewport: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226,232,240,0.9)',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: '#F8FAFC',
  },
});
