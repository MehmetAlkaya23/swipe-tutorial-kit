import {
  arrowRotation,
  DEFAULT_TIMING,
  describeHints,
  directionVector,
  hintCycleDuration,
  hintEndpoint,
} from '../motion';

describe('directionVector', () => {
  it('uses screen coordinates', () => {
    expect(directionVector('right')).toEqual({ x: 1, y: 0 });
    expect(directionVector('left')).toEqual({ x: -1, y: 0 });
    expect(directionVector('up')).toEqual({ x: 0, y: -1 });
    expect(directionVector('down')).toEqual({ x: 0, y: 1 });
  });
});

describe('arrowRotation', () => {
  it.each([
    ['right', '0deg'],
    ['down', '90deg'],
    ['left', '180deg'],
    ['up', '270deg'],
  ] as const)('points %s', (direction, rotation) => {
    expect(arrowRotation(direction)).toBe(rotation);
  });
});

describe('hintEndpoint', () => {
  const timing = { distance: 100, tilt: 10 };

  it('tilts horizontal swipes in the direction of travel', () => {
    expect(hintEndpoint('right', timing)).toEqual({ translateX: 100, translateY: 0, rotate: 10 });
    expect(hintEndpoint('left', timing)).toEqual({ translateX: -100, translateY: 0, rotate: -10 });
  });

  it('does not tilt vertical swipes', () => {
    expect(hintEndpoint('up', timing)).toMatchObject({ translateX: 0, translateY: -100 });
    expect(hintEndpoint('up', timing).rotate === 0).toBe(true);
    expect(hintEndpoint('down', timing)).toMatchObject({ translateX: 0, translateY: 100 });
  });
});

it('sums every phase into the cycle duration', () => {
  expect(hintCycleDuration(DEFAULT_TIMING)).toBe(650 + 250 + 200 + 450);
});

describe('describeHints', () => {
  it('builds a sentence per hint', () => {
    expect(
      describeHints([
        { direction: 'right', label: 'Keep' },
        { direction: 'up', label: 'Delete' },
      ]),
    ).toBe('Swipe right to keep. Swipe up to delete');
  });

  it('prefers an explicit accessibility label', () => {
    expect(
      describeHints([{ direction: 'left', label: 'Skip', accessibilityLabel: 'Swipe left to skip a photo' }]),
    ).toBe('Swipe left to skip a photo');
  });
});
