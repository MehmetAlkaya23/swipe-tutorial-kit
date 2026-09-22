import type { SwipeDirection, SwipeTutorialTiming } from './types';

export const DEFAULT_TIMING: SwipeTutorialTiming = {
  swipeDuration: 650,
  holdDuration: 250,
  fadeDuration: 200,
  pauseDuration: 450,
  distance: 110,
  tilt: 12,
};

export interface Vector {
  x: number;
  y: number;
}

const VECTORS: Record<SwipeDirection, Vector> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

/** Unit vector for a direction, in screen coordinates (y grows downward). */
export function directionVector(direction: SwipeDirection): Vector {
  return VECTORS[direction];
}

/** Rotation that makes a right-pointing chevron point in `direction`. */
export function arrowRotation(direction: SwipeDirection): string {
  switch (direction) {
    case 'right':
      return '0deg';
    case 'down':
      return '90deg';
    case 'left':
      return '180deg';
    case 'up':
      return '270deg';
  }
}

/** Where the demo card ends up for a hint, including its tilt in degrees. */
export function hintEndpoint(
  direction: SwipeDirection,
  timing: Pick<SwipeTutorialTiming, 'distance' | 'tilt'>,
): { translateX: number; translateY: number; rotate: number } {
  const v = directionVector(direction);
  return {
    translateX: v.x * timing.distance,
    translateY: v.y * timing.distance,
    // Only horizontal swipes tilt, the way a card pivots under a thumb.
    rotate: v.x * timing.tilt,
  };
}

/** Total time one hint occupies on screen, used to schedule the next one. */
export function hintCycleDuration(timing: SwipeTutorialTiming): number {
  return (
    timing.swipeDuration +
    timing.holdDuration +
    timing.fadeDuration +
    timing.pauseDuration
  );
}

/**
 * Builds the sentence screen readers announce, so the tutorial is useful
 * without seeing the animation.
 */
export function describeHints(
  hints: ReadonlyArray<{
    direction: SwipeDirection;
    label: string;
    accessibilityLabel?: string;
  }>,
): string {
  return hints
    .map((h) => h.accessibilityLabel ?? `Swipe ${h.direction} to ${h.label.toLowerCase()}`)
    .join('. ');
}
