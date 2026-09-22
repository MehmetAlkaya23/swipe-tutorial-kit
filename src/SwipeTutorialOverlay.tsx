import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  arrowRotation,
  DEFAULT_TIMING,
  describeHints,
  hintEndpoint,
} from './motion';
import { DEFAULT_THEME } from './theme';
import type {
  RenderCard,
  SwipeHint,
  SwipeTutorialTheme,
  SwipeTutorialTiming,
} from './types';

export interface SwipeTutorialOverlayProps {
  visible: boolean;
  /** Gestures to demonstrate, played in order and looped. */
  hints: ReadonlyArray<SwipeHint>;
  /** Called by the dismiss button and the Android back button. */
  onDismiss: () => void;
  title?: string;
  dismissLabel?: string;
  /** Let a tap outside the card dismiss the tutorial. Off by default so users do not skip it by accident. */
  dismissOnBackdropPress?: boolean;
  /** Replace the placeholder card, e.g. with a real photo thumbnail. */
  renderCard?: RenderCard;
  theme?: Partial<SwipeTutorialTheme>;
  timing?: Partial<SwipeTutorialTiming>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Unsupported platform: keep animating.
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

function Chevron({ color, rotate }: { color: string; rotate: string }) {
  return (
    <View style={[styles.chevronBox, { transform: [{ rotate }] }]}>
      <View style={[styles.chevron, { borderColor: color }]} />
    </View>
  );
}

function PlaceholderCard({ theme }: { theme: SwipeTutorialTheme }) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardColor, borderColor: theme.cardBorderColor },
      ]}
    >
      <View style={[styles.cardMedia, { backgroundColor: theme.accentColor }]} />
      <View style={styles.cardLineWide} />
      <View style={styles.cardLineNarrow} />
    </View>
  );
}

export function SwipeTutorialOverlay({
  visible,
  hints,
  onDismiss,
  title = 'How it works',
  dismissLabel = 'Got it',
  dismissOnBackdropPress = false,
  renderCard,
  theme: themeOverrides,
  timing: timingOverrides,
  style,
  testID = 'swipe-tutorial',
}: SwipeTutorialOverlayProps) {
  const theme = { ...DEFAULT_THEME, ...themeOverrides };
  const {
    swipeDuration = DEFAULT_TIMING.swipeDuration,
    holdDuration = DEFAULT_TIMING.holdDuration,
    fadeDuration = DEFAULT_TIMING.fadeDuration,
    pauseDuration = DEFAULT_TIMING.pauseDuration,
    distance = DEFAULT_TIMING.distance,
    tilt = DEFAULT_TIMING.tilt,
  } = timingOverrides ?? {};

  const reduceMotion = useReduceMotion();
  const [index, setIndex] = useState(0);
  // Lazy state gives each instance stable Animated values without reading refs during render.
  const [progress] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));

  const count = hints.length;
  const safeIndex = count > 0 ? index % count : 0;
  const hint = hints[safeIndex];

  // Start from the first hint every time the overlay opens. Adjusting state
  // during render avoids a flash of the previous hint.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setIndex(0);
  }

  useEffect(() => {
    if (!visible || reduceMotion || count === 0) {
      return undefined;
    }
    progress.setValue(0);
    opacity.setValue(1);
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: swipeDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(holdDuration),
      Animated.timing(opacity, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
      Animated.delay(pauseDuration),
    ]);
    animation.start(({ finished }) => {
      if (finished) setIndex((i) => (i + 1) % count);
    });
    return () => animation.stop();
  }, [
    visible,
    reduceMotion,
    count,
    safeIndex,
    progress,
    opacity,
    swipeDuration,
    holdDuration,
    fadeDuration,
    pauseDuration,
  ]);

  const cardStyle = useMemo(() => {
    if (!hint) return undefined;
    const end = hintEndpoint(hint.direction, { distance, tilt });
    return {
      opacity,
      transform: [
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, end.translateX] }) },
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, end.translateY] }) },
        {
          rotate: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${end.rotate}deg`],
          }),
        },
      ],
    };
  }, [hint, distance, tilt, progress, opacity]);

  if (count === 0) {
    return null;
  }

  const summary = describeHints(hints);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
      testID={testID}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.backdropColor }, style]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdropPress ? onDismiss : undefined}
          disabled={!dismissOnBackdropPress}
          accessible={false}
          testID={`${testID}-backdrop`}
        />
        <View
          style={styles.content}
          pointerEvents="box-none"
          accessibilityViewIsModal
        >
          {/* The title carries the whole summary, so screen readers get every
              gesture in one announcement instead of chasing the animation. */}
          <Text
            style={[styles.title, { color: theme.textColor }]}
            accessibilityRole="header"
            accessibilityLabel={`${title}. ${summary}`}
          >
            {title}
          </Text>

          {reduceMotion ? (
            <View style={styles.staticList} testID={`${testID}-static`}>
              {hints.map((h, i) => (
                <View key={`${i}-${h.direction}`} style={styles.hintRow}>
                  <Chevron color={h.color ?? theme.accentColor} rotate={arrowRotation(h.direction)} />
                  <Text style={[styles.hintLabel, { color: h.color ?? theme.accentColor }]}>
                    {h.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            hint && (
              <>
                <View
                  style={styles.stage}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Animated.View style={cardStyle} testID={`${testID}-card`}>
                    {renderCard ? renderCard(hint) : <PlaceholderCard theme={theme} />}
                  </Animated.View>
                </View>
                <View style={styles.hintRow} testID={`${testID}-hint`}>
                  <Chevron
                    color={hint.color ?? theme.accentColor}
                    rotate={arrowRotation(hint.direction)}
                  />
                  <Text style={[styles.hintLabel, { color: hint.color ?? theme.accentColor }]}>
                    {hint.label}
                  </Text>
                </View>
                {count > 1 && (
                  <View
                    style={styles.dots}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    {hints.map((h, i) => (
                      <View
                        key={`${i}-${h.direction}`}
                        style={[
                          styles.dot,
                          { backgroundColor: theme.textColor },
                          i === safeIndex ? styles.dotActive : null,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            )
          )}

          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            hitSlop={8}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.buttonColor, opacity: pressed ? 0.8 : 1 },
            ]}
            testID={`${testID}-dismiss`}
          >
            <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>
              {dismissLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const CARD_WIDTH = 168;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  stage: {
    // Leaves room for the card to travel without clipping the controls.
    height: 260,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 18,
    borderWidth: 2,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardMedia: {
    flex: 1,
    borderRadius: 12,
    opacity: 0.35,
    marginBottom: 12,
  },
  cardLineWide: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginBottom: 8,
  },
  cardLineNarrow: {
    height: 10,
    width: '60%',
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  staticList: {
    marginBottom: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  hintLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  chevronBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 11,
    height: 11,
    borderTopWidth: 3,
    borderRightWidth: 3,
    marginLeft: -4,
    transform: [{ rotate: '45deg' }],
  },
  dots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    opacity: 0.35,
  },
  dotActive: {
    opacity: 1,
  },
  button: {
    marginTop: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
