import {
  Animated,
  Easing,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Vec2D } from './types';

export function calcGestureTouchDistance(
  e: GestureResponderEvent,
  gestureState: PanResponderGestureState
): number | null {
  const touches = e?.nativeEvent?.touches;
  if (gestureState.numberActiveTouches !== 2 || !touches[0] || !touches[1])
    return null;

  const dx = Math.abs(touches[0].pageX - touches[1].pageX);
  const dy = Math.abs(touches[0].pageY - touches[1].pageY);
  return Math.sqrt(dx * dx + dy * dy);
}

export function calcNewScaledOffsetForZoomCentering(
  oldOffsetXOrYScaled: number,
  zoomSubjectOriginalWidthOrHeight: number,
  oldScale: number,
  newScale: number,
  zoomCenterXOrY: number
) {
  const oldOffSetUnscaled = oldOffsetXOrYScaled * oldScale;
  const growthRate = newScale / oldScale;

  // these act like namespaces just for the sake of readability
  const zoomSubjectOriginalCenter = {} as Center;
  const zoomSubjectCurrentCenter = {} as Center;
  const zoomSubjectNewCenter = {} as Center;

  zoomSubjectOriginalCenter.xOrY = zoomSubjectOriginalWidthOrHeight / 2;
  zoomSubjectCurrentCenter.xOrY =
    zoomSubjectOriginalCenter.xOrY + oldOffSetUnscaled;
  zoomSubjectCurrentCenter.distanceToZoomCenter =
    zoomSubjectCurrentCenter.xOrY - zoomCenterXOrY;

  zoomSubjectNewCenter.distanceToZoomCenter =
    zoomSubjectCurrentCenter.distanceToZoomCenter * growthRate;
  zoomSubjectNewCenter.xOrY =
    zoomSubjectNewCenter.distanceToZoomCenter + zoomCenterXOrY;

  const newOffsetUnscaled =
    zoomSubjectNewCenter.xOrY - zoomSubjectOriginalCenter.xOrY;

  return newOffsetUnscaled / newScale;
}

interface Center {
  xOrY: number;
  distanceToZoomCenter: number;
}
export function applyPanBoundariesToOffset(
  offsetScaled: number,
  containerSize: number,
  contentSize: number,
  scale: number,
  boundaryPadding: number
) {
  const contentSizeUnscaled = contentSize * scale;
  const offsetUnscaled = offsetScaled * scale;

  const contentStartBorderUnscaled =
    containerSize / 2 + offsetUnscaled - contentSizeUnscaled / 2;
  const contentEndBorderUnscaled =
    contentStartBorderUnscaled + contentSizeUnscaled;

  const containerStartBorder = 0;
  const containerEndBorder = containerStartBorder + containerSize;

  // do not let boundary padding be greater than the container size or less than 0
  if (!boundaryPadding || boundaryPadding < 0) boundaryPadding = 0;
  if (boundaryPadding > containerSize) boundaryPadding = containerSize;

  // Calculate container's measurements with boundary padding applied.
  // this should shrink the container's size by the amount of the boundary padding,
  // so that the content inside can be panned a bit further away from the original container's boundaries.
  const paddedContainerSize = containerSize - boundaryPadding * 2;
  const paddedContainerStartBorder = containerStartBorder + boundaryPadding;
  const paddedContainerEndBorder = containerEndBorder - boundaryPadding;

  // if content is smaller than the padded container,
  // don't let the content move
  if (contentSizeUnscaled < paddedContainerSize) {
    return 0;
  }

  // if content is larger than the padded container,
  // don't let the padded container go outside of content

  // maximum distance the content's center can move from its original position.
  // assuming the content original center is the container's center.
  const contentMaxOffsetScaled =
    (paddedContainerSize / 2 - contentSizeUnscaled / 2) / scale;

  if (
    // content reaching the end boundary
    contentEndBorderUnscaled < paddedContainerEndBorder
  ) {
    return contentMaxOffsetScaled;
  }
  if (
    // content reaching the start boundary
    contentStartBorderUnscaled > paddedContainerStartBorder
  ) {
    return -contentMaxOffsetScaled;
  }

  return offsetScaled;
}
export function getBoundaryCrossedAnim(
  animValue: Animated.Value,
  toValue: number
) {
  return Animated.spring(animValue, {
    overshootClamping: true,
    toValue,
    useNativeDriver: true,
  });
}

export function getPanMomentumDecayAnim(
  animValue: Animated.Value | Animated.ValueXY,
  velocity: number | Vec2D
) {
  return Animated.decay(animValue, {
    velocity,
    deceleration: 0.994,
    useNativeDriver: true,
  });
}

export function getZoomToAnimation(animValue: Animated.Value, toValue: number) {
  return Animated.timing(animValue, {
    easing: Easing.out(Easing.ease),
    toValue,
    useNativeDriver: true,
  });
}
