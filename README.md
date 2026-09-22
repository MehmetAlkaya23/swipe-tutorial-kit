# react-native-swipe-tutorial-kit

Teach first-time users how to swipe, once.

A small onboarding overlay for card-swipe interfaces (photo cleaners, dating
decks, flashcards, inbox triage). It plays an animated demo of each gesture,
such as "swipe right to keep" and "swipe up to delete", then remembers that the
user has seen it.

- **No runtime dependencies.** Built on React Native's `Animated` API, so it works in Expo Go and bare apps with no native install.
- **Bring your own storage.** Pass AsyncStorage, MMKV, SecureStore, or anything with `getItem` / `setItem` / `removeItem`.
- **Versioned.** Change your gestures, bump `version`, and only users who saw the old tutorial see the new one.
- **Accessible.** Honors Reduce Motion with a static layout, announces every gesture to screen readers, and hides the decorative animation from them.
- **Typed and tested.** Strict TypeScript, 100% line coverage.

## Install

```sh
npm install react-native-swipe-tutorial-kit
# and a storage backend, if you don't have one yet
npx expo install @react-native-async-storage/async-storage
```

Requires React 18.2+ and React Native 0.72+.

## Quick start

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwipeTutorial } from 'react-native-swipe-tutorial-kit';

export function PhotoDeckScreen() {
  return (
    <>
      <PhotoDeck />
      <SwipeTutorial
        id="photo-deck"
        storage={AsyncStorage}
        hints={[
          { direction: 'right', label: 'Keep', color: '#3DDC97' },
          { direction: 'up', label: 'Delete', color: '#FF5A5F' },
        ]}
      />
    </>
  );
}
```

The overlay renders in a transparent `Modal`, so it can sit anywhere in the
screen's tree. It shows on first launch, and after the user taps **Got it** it
never shows again for that `id` and `version`.

## Taking control

`SwipeTutorial` is `useSwipeTutorial` plus `SwipeTutorialOverlay`. Use the two
directly when you need to reopen the tutorial from a help menu, wait until the
deck has loaded, or show a real card from your deck in the demo.

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwipeTutorialOverlay, useSwipeTutorial } from 'react-native-swipe-tutorial-kit';

function PhotoDeckScreen({ photos }: { photos: Photo[] }) {
  const tutorial = useSwipeTutorial({
    id: 'photo-deck',
    storage: AsyncStorage,
    version: 2, // bumped when "swipe up to delete" was added
    enabled: photos.length > 0,
  });

  return (
    <>
      <PhotoDeck photos={photos} />
      <HelpButton onPress={tutorial.show} />

      <SwipeTutorialOverlay
        visible={tutorial.visible}
        onDismiss={tutorial.complete}
        hints={HINTS}
        title="Clean up in two swipes"
        dismissLabel="Start sorting"
        renderCard={() => <PhotoCard photo={photos[0]} small />}
      />
    </>
  );
}
```

## API

### `useSwipeTutorial(options)`

| Option | Type | Default | |
| --- | --- | --- | --- |
| `id` | `string` | required | Namespaces the storage key. Use one id per tutorial. |
| `storage` | `TutorialStorage` | required | Where completion is saved. |
| `version` | `number` | `1` | Users who completed a lower version see the tutorial again. |
| `enabled` | `boolean` | `true` | When `false`, `visible` stays `false`. Completion state still loads. |
| `onError` | `(error) => void` | | Storage failures are reported here and never thrown. |

Returns:

| Field | Type | |
| --- | --- | --- |
| `status` | `'loading' \| 'pending' \| 'completed'` | |
| `visible` | `boolean` | `enabled && status === 'pending'` |
| `complete()` | `() => Promise<void>` | Hides the tutorial and saves completion. |
| `show()` | `() => void` | Reopens it for this session without clearing storage. |
| `reset()` | `() => Promise<void>` | Clears storage and reopens it. |

Failure behavior is deliberate. If reading storage fails, the tutorial shows,
because teaching a gesture twice is better than never. If saving fails, it
stays hidden for the session and will show again next launch. A user action
always wins over a storage read that is still in flight.

### `<SwipeTutorialOverlay />`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `visible` | `boolean` | required | |
| `hints` | `SwipeHint[]` | required | Played in order and looped. Renders nothing when empty. |
| `onDismiss` | `() => void` | required | Called by the button and the Android back button. |
| `title` | `string` | `'How it works'` | |
| `dismissLabel` | `string` | `'Got it'` | |
| `dismissOnBackdropPress` | `boolean` | `false` | Off by default so users don't skip it by accident. |
| `renderCard` | `(hint) => ReactNode` | placeholder card | Render something from your own deck. |
| `theme` | `Partial<SwipeTutorialTheme>` | `DEFAULT_THEME` | Colors for backdrop, card, text, accent and button. |
| `timing` | `Partial<SwipeTutorialTiming>` | `DEFAULT_TIMING` | Durations in ms, travel `distance` in points, `tilt` in degrees. |
| `style` | `StyleProp<ViewStyle>` | | Applied to the backdrop. |
| `testID` | `string` | `'swipe-tutorial'` | Children get `-card`, `-hint`, `-dismiss`, `-backdrop`, `-static` suffixes. |

### `<SwipeTutorial />`

Takes every `useSwipeTutorial` option and every overlay prop except `visible`
and `onDismiss`, plus `onComplete?: () => void`.

### `SwipeHint`

```ts
interface SwipeHint {
  direction: 'left' | 'right' | 'up' | 'down';
  label: string;               // "Keep"
  color?: string;              // arrow and label color
  accessibilityLabel?: string; // defaults to "Swipe right to keep"
}
```

### Storage

```ts
interface TutorialStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

AsyncStorage matches this shape as is. Other backends take a few lines:

```ts
// react-native-mmkv
const mmkvStorage: TutorialStorage = {
  getItem: async (key) => mmkv.getString(key) ?? null,
  setItem: async (key, value) => mmkv.set(key, value),
  removeItem: async (key) => mmkv.delete(key),
};
```

`createMemoryStorage()` keeps state for the life of the process, which suits
tests and Storybook. Keys are `@swipe-tutorial-kit/<id>`; `storageKey(id)`
returns the exact key.

## Testing your app

With `createMemoryStorage` and the default test IDs:

```tsx
render(<Screen storage={createMemoryStorage()} />);
fireEvent.press(await screen.findByRole('button', { name: 'Got it' }));
```

To start with the tutorial already completed, seed the storage:

```ts
createMemoryStorage({
  [storageKey('photo-deck')]: JSON.stringify({ version: 1, completedAt: new Date().toISOString() }),
});
```

## Example app

`example/` is an Expo app with a small photo-cleaner deck (right to keep, up to
delete) wired to the tutorial.

```sh
cd example
npm install
npx expo start
```

## Development

```sh
npm install
npm run check   # typecheck, lint, tests
npm run build   # emits lib/ with type declarations
```

## License

MIT
