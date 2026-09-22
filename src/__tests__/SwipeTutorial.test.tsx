import { AccessibilityInfo, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { SwipeTutorial } from '../SwipeTutorial';
import { SwipeTutorialOverlay } from '../SwipeTutorialOverlay';
import { createMemoryStorage, storageKey } from '../storage';
import type { SwipeHint } from '../types';

const hints: SwipeHint[] = [
  { direction: 'right', label: 'Keep', color: '#2ECC71' },
  { direction: 'up', label: 'Delete', color: '#FF5A5F' },
];

const TIMING = {
  swipeDuration: 100,
  holdDuration: 10,
  fadeDuration: 10,
  pauseDuration: 10,
};
const CYCLE = 130;

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('SwipeTutorialOverlay', () => {
  it('renders the first hint and a dismiss button', async () => {
    render(<SwipeTutorialOverlay visible hints={hints} onDismiss={jest.fn()} />);

    expect(await screen.findByText('Keep')).toBeOnTheScreen();
    expect(screen.getByText('How it works')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeOnTheScreen();
  });

  it('describes every gesture to screen readers', async () => {
    render(<SwipeTutorialOverlay visible hints={hints} onDismiss={jest.fn()} />);

    expect(
      await screen.findByLabelText('How it works. Swipe right to keep. Swipe up to delete'),
    ).toBeOnTheScreen();
  });

  it('cycles through the hints', async () => {
    jest.useFakeTimers();
    render(<SwipeTutorialOverlay visible hints={hints} onDismiss={jest.fn()} timing={TIMING} />);
    await act(async () => {});
    expect(screen.getByText('Keep')).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(CYCLE + 50);
    });

    expect(screen.getByText('Delete')).toBeOnTheScreen();
    expect(screen.queryByText('Keep')).toBeNull();
  });

  it('calls onDismiss from the button', async () => {
    const onDismiss = jest.fn();
    render(<SwipeTutorialOverlay visible hints={hints} onDismiss={onDismiss} dismissLabel="Let's go" />);

    fireEvent.press(await screen.findByRole('button', { name: "Let's go" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores backdrop taps unless enabled', async () => {
    const onDismiss = jest.fn();
    const { rerender } = render(
      <SwipeTutorialOverlay visible hints={hints} onDismiss={onDismiss} />,
    );
    // The backdrop is deliberately hidden from assistive tech (the content is
    // the modal view), so opt into hidden elements to reach it.
    const backdrop = { includeHiddenElements: true };
    fireEvent.press(await screen.findByTestId('swipe-tutorial-backdrop', backdrop));
    expect(onDismiss).not.toHaveBeenCalled();

    rerender(<SwipeTutorialOverlay visible hints={hints} onDismiss={onDismiss} dismissOnBackdropPress />);
    fireEvent.press(screen.getByTestId('swipe-tutorial-backdrop', backdrop));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows every hint at once when reduce motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    render(<SwipeTutorialOverlay visible hints={hints} onDismiss={jest.fn()} />);

    expect(await screen.findByTestId('swipe-tutorial-static')).toBeOnTheScreen();
    expect(screen.getByText('Keep')).toBeOnTheScreen();
    expect(screen.getByText('Delete')).toBeOnTheScreen();
    expect(screen.queryByTestId('swipe-tutorial-card', { includeHiddenElements: true })).toBeNull();
  });

  it('renders a custom card for each hint', async () => {
    jest.useFakeTimers();
    render(
      <SwipeTutorialOverlay
        visible
        hints={hints}
        onDismiss={jest.fn()}
        timing={TIMING}
        renderCard={(hint) => <Text>{`card for ${hint.label}`}</Text>}
      />,
    );
    await act(async () => {});
    // The demo card is decorative and hidden from assistive tech.
    const hidden = { includeHiddenElements: true };
    expect(screen.getByText('card for Keep', hidden)).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(CYCLE + 50);
    });

    expect(screen.getByText('card for Delete', hidden)).toBeOnTheScreen();
  });

  it('renders nothing without hints', () => {
    render(<SwipeTutorialOverlay visible hints={[]} onDismiss={jest.fn()} />);

    expect(screen.toJSON()).toBeNull();
  });

  it('renders nothing while hidden', async () => {
    render(<SwipeTutorialOverlay visible={false} hints={hints} onDismiss={jest.fn()} />);
    await act(async () => {});

    expect(screen.queryByText('Keep')).toBeNull();
  });
});

describe('SwipeTutorial', () => {
  it('shows once, then remembers the user has seen it', async () => {
    const storage = createMemoryStorage();
    const onComplete = jest.fn();
    const first = render(
      <SwipeTutorial id="deck" storage={storage} hints={hints} onComplete={onComplete} />,
    );

    fireEvent.press(await screen.findByRole('button', { name: 'Got it' }));
    await act(async () => {});

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Keep')).toBeNull();
    expect(await storage.getItem(storageKey('deck'))).not.toBeNull();
    first.unmount();

    // A later app launch with the same storage.
    render(<SwipeTutorial id="deck" storage={storage} hints={hints} />);
    await act(async () => {});

    expect(screen.queryByText('Keep')).toBeNull();
  });
});
