export interface Photo {
  id: string;
  emoji: string;
  title: string;
  color: string;
}

// Stand-ins for camera-roll items, so the example runs offline with no permissions.
export const PHOTOS: Photo[] = [
  { id: '1', emoji: '🌅', title: 'Sunset, Bodrum', color: '#FF8A5B' },
  { id: '2', emoji: '🐈', title: 'Blurry cat', color: '#8E7CFF' },
  { id: '3', emoji: '🍕', title: 'Dinner', color: '#FFC24B' },
  { id: '4', emoji: '📄', title: 'Screenshot of a receipt', color: '#5BC0EB' },
  { id: '5', emoji: '🏔️', title: 'Hike', color: '#3DDC97' },
];
