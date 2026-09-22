import { useCallback } from 'react';

import {
  SwipeTutorialOverlay,
  type SwipeTutorialOverlayProps,
} from './SwipeTutorialOverlay';
import {
  useSwipeTutorial,
  type UseSwipeTutorialOptions,
} from './useSwipeTutorial';

export interface SwipeTutorialProps
  extends UseSwipeTutorialOptions,
    Omit<SwipeTutorialOverlayProps, 'visible' | 'onDismiss'> {
  /** Called once the user dismisses the tutorial. */
  onComplete?: () => void;
}

/**
 * Drop-in tutorial: shows the overlay the first time, remembers completion,
 * and stays out of the way afterwards. Use `useSwipeTutorial` together with
 * `SwipeTutorialOverlay` when you need to control it yourself.
 */
export function SwipeTutorial({
  id,
  storage,
  version,
  enabled,
  onError,
  onComplete,
  ...overlayProps
}: SwipeTutorialProps) {
  const { visible, complete } = useSwipeTutorial({
    id,
    storage,
    version,
    enabled,
    onError,
  });

  const handleDismiss = useCallback(() => {
    void complete();
    onComplete?.();
  }, [complete, onComplete]);

  return (
    <SwipeTutorialOverlay
      {...overlayProps}
      visible={visible}
      onDismiss={handleDismiss}
    />
  );
}
