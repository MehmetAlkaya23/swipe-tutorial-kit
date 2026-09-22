import { useMemo, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Photo } from './photos';

export type DeckAction = 'keep' | 'delete';

interface Props {
  photos: Photo[];
  onSwipe: (photo: Photo, action: DeckAction) => void;
}

const SWIPE_THRESHOLD = 110;

/** A deliberately small swipe deck: right keeps, up deletes. */
export function SwipeDeck({ photos, onSwipe }: Props) {
  const { width, height } = useWindowDimensions();
  const [position] = useState(() => new Animated.ValueXY());
  const top = photos[0];

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_e, g) => {
          const action: DeckAction | null =
            g.dx > SWIPE_THRESHOLD ? 'keep' : g.dy < -SWIPE_THRESHOLD ? 'delete' : null;
          if (!action || !top) {
            Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
            return;
          }
          const toValue = action === 'keep' ? { x: width * 1.5, y: g.dy } : { x: g.dx, y: -height };
          Animated.timing(position, { toValue, duration: 220, useNativeDriver: false }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onSwipe(top, action);
          });
        },
      }),
    [position, top, width, height, onSwipe],
  );

  if (!top) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>All sorted ✨</Text>
      </View>
    );
  }

  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <View style={styles.deck}>
      {photos[1] && <Card photo={photos[1]} style={styles.behind} />}
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [...position.getTranslateTransform(), { rotate }] }}
      >
        <Card photo={top} />
      </Animated.View>
    </View>
  );
}

export function Card({ photo, style }: { photo: Photo; style?: object }) {
  return (
    <View style={[styles.card, { backgroundColor: photo.color }, style]}>
      <Text style={styles.emoji}>{photo.emoji}</Text>
      <Text style={styles.title}>{photo.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { alignItems: 'center', justifyContent: 'center', height: 440 },
  card: {
    width: 280,
    height: 380,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  behind: { position: 'absolute', transform: [{ scale: 0.94 }], opacity: 0.6 },
  emoji: { fontSize: 96 },
  title: { marginTop: 16, fontSize: 20, fontWeight: '700', color: '#0B0D12', textAlign: 'center' },
  empty: { height: 440, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#FFFFFF', fontSize: 22, fontWeight: '600' },
});
