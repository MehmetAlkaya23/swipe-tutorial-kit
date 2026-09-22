import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  SwipeTutorialOverlay,
  useSwipeTutorial,
  type SwipeHint,
} from 'react-native-swipe-tutorial-kit';

import { Card, SwipeDeck, type DeckAction } from './src/SwipeDeck';
import { PHOTOS, type Photo } from './src/photos';

const HINTS: SwipeHint[] = [
  {
    direction: 'right',
    label: 'Keep',
    color: '#3DDC97',
    accessibilityLabel: 'Swipe a photo right to keep it',
  },
  {
    direction: 'up',
    label: 'Delete',
    color: '#FF5A5F',
    accessibilityLabel: 'Swipe a photo up to delete it',
  },
];

export default function App() {
  const [photos, setPhotos] = useState(PHOTOS);
  const [log, setLog] = useState<string[]>([]);

  const tutorial = useSwipeTutorial({
    id: 'photo-deck',
    storage: AsyncStorage,
    version: 1,
    // Only teach the gesture when there is something to swipe.
    enabled: photos.length > 0,
    onError: (error) => console.warn('[swipe-tutorial]', error),
  });

  const handleSwipe = useCallback((photo: Photo, action: DeckAction) => {
    setPhotos((current) => current.filter((p) => p.id !== photo.id));
    setLog((current) => [`${action === 'keep' ? 'Kept' : 'Deleted'} ${photo.title}`, ...current]);
  }, []);

  const restart = useCallback(() => {
    setPhotos(PHOTOS);
    setLog([]);
    void tutorial.reset();
  }, [tutorial]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <Text style={styles.heading}>Photo cleaner</Text>

      <SwipeDeck photos={photos} onSwipe={handleSwipe} />

      <View style={styles.footer}>
        <Text style={styles.log} numberOfLines={1}>
          {log[0] ?? 'Swipe right to keep, up to delete.'}
        </Text>
        <View style={styles.row}>
          <Pressable style={styles.link} onPress={tutorial.show} accessibilityRole="button">
            <Text style={styles.linkText}>Show tips</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={restart} accessibilityRole="button">
            <Text style={styles.linkText}>Reset demo</Text>
          </Pressable>
        </View>
      </View>

      <SwipeTutorialOverlay
        visible={tutorial.visible}
        hints={HINTS}
        onDismiss={tutorial.complete}
        title="Clean up in two swipes"
        dismissLabel="Start sorting"
        renderCard={() => <Card photo={photos[0] ?? PHOTOS[0]!} style={styles.previewCard} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0D12', justifyContent: 'center' },
  heading: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  footer: { alignItems: 'center', marginTop: 16 },
  log: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row' },
  link: { paddingHorizontal: 16, paddingVertical: 10 },
  linkText: { color: '#4F8CFF', fontSize: 16, fontWeight: '600' },
  previewCard: { width: 168, height: 218 },
});
