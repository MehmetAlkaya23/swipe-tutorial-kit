import type { ReactNode } from 'react';

/** A direction the user can swipe a card in. */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/** One gesture the tutorial demonstrates, e.g. "swipe right to keep". */
export interface SwipeHint {
  direction: SwipeDirection;
  /** Short, action-oriented copy shown while the hint plays, e.g. "Keep". */
  label: string;
  /** Accent color for the arrow and label. Defaults to the theme accent. */
  color?: string;
  /** Optional longer text for screen readers, e.g. "Swipe right to keep a photo". */
  accessibilityLabel?: string;
}

/** Visual tokens for the overlay. Every field is optional. */
export interface SwipeTutorialTheme {
  backdropColor: string;
  cardColor: string;
  cardBorderColor: string;
  textColor: string;
  accentColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

/** Timing and distance of the demo animation, in milliseconds and points. */
export interface SwipeTutorialTiming {
  /** How long the card takes to travel in the hint direction. */
  swipeDuration: number;
  /** How long the card holds at the end before fading out. */
  holdDuration: number;
  /** How long the card takes to fade out. */
  fadeDuration: number;
  /** Pause between two hints. */
  pauseDuration: number;
  /** How far the card travels, in points. */
  distance: number;
  /** Tilt applied to horizontal swipes, in degrees. */
  tilt: number;
}

export type RenderCard = (hint: SwipeHint) => ReactNode;
