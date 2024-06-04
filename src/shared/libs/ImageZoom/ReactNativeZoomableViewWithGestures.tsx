import {
  ReactNativeZoomableViewState,
  ReactNativeZoomableViewWithGesturesProps,
} from './types';
import React from 'react';
import ReactNativeZoomableView from './ReactNativeZoomableView';

export const swipeDirections = {
  SWIPE_UP: 'SWIPE_UP',
  SWIPE_DOWN: 'SWIPE_DOWN',
  SWIPE_LEFT: 'SWIPE_LEFT',
  SWIPE_RIGHT: 'SWIPE_RIGHT',
};

class ReactNativeZoomableViewWithGestures extends React.Component<
  ReactNativeZoomableViewWithGesturesProps,
  ReactNativeZoomableViewState
> {
  zoomableViewRef: React.RefObject<ReactNativeZoomableView> | undefined;

  constructor(props: ReactNativeZoomableViewWithGesturesProps) {
    super(props);
    this.zoomableViewRef = React.createRef<ReactNativeZoomableView>();
  }

  _onShiftingEnd = (e, gestureState, zoomableViewState) => {
    if (this.props.onShiftingEnd) {
      this.props.onShiftingEnd(e, gestureState, zoomableViewState);
    }

    if (!this._couldCallSwipeEvent(zoomableViewState)) {
      return;
    }

    const swipeDirection = this._getSwipeDirection(gestureState);
    this._triggerSwipeHandlers(swipeDirection, gestureState);
  };

  /**
   * Checks if current config options make it possible to process a swipe or if is not necessary
   *
   * @returns {*}
   * @private
   */
  _couldCallSwipeEvent(zoomableViewState) {
    const {
      onSwipe,
      onSwipeUp,
      onSwipeDown,
      onSwipeLeft,
      onSwipeRight,
      swipeMaxZoom,
      swipeMinZoom,
    } = this.props;

    if (swipeMaxZoom && zoomableViewState.zoomLevel > swipeMaxZoom) {
      return false;
    }

    if (swipeMinZoom && zoomableViewState.zoomLevel < swipeMinZoom) {
      return false;
    }

    return onSwipe || onSwipeUp || onSwipeDown || onSwipeLeft || onSwipeRight;
  }

  /**
   * Checks the swipe and validates whether we should process it or not
   *
   * @param gestureState
   * @returns {*|boolean}
   *
   * @private
   */
  _validateSwipe(gestureState) {
    const { onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight } = this.props;
    const swipeDirection = this._getSwipeDirection(gestureState);
    const { SWIPE_LEFT, SWIPE_RIGHT, SWIPE_UP, SWIPE_DOWN } = swipeDirections;

    return (
      (onSwipeUp && swipeDirection === SWIPE_UP) ||
      (onSwipeDown && swipeDirection === SWIPE_DOWN) ||
      (onSwipeLeft && swipeDirection === SWIPE_LEFT) ||
      (onSwipeRight && swipeDirection === SWIPE_RIGHT)
    );
  }

  /**
   * Triggers the correct directional callback
   *
   * @param swipeDirection
   * @param gestureState
   * @private
   */
  _triggerSwipeHandlers(swipeDirection, gestureState) {
    const { onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight } =
      this.props;
    const { SWIPE_LEFT, SWIPE_RIGHT, SWIPE_UP, SWIPE_DOWN } = swipeDirections;

    // trigger the general onswipe callback
    if (onSwipe) {
      onSwipe(swipeDirection, gestureState);
    }

    // trigger the direction specific swipe callback
    switch (swipeDirection) {
      case SWIPE_LEFT:
        onSwipeLeft && onSwipeLeft(gestureState);
        break;
      case SWIPE_RIGHT:
        onSwipeRight && onSwipeRight(gestureState);
        break;
      case SWIPE_UP:
        onSwipeUp && onSwipeUp(gestureState);
        break;
      case SWIPE_DOWN:
        onSwipeDown && onSwipeDown(gestureState);
        break;
    }
  }

  /**
   * Calculates what direction the user swiped
   *
   * @param gestureState
   * @returns {*}
   * @private
   */
  _getSwipeDirection(gestureState) {
    const { swipeLengthThreshold } = this.props;
    const { SWIPE_LEFT, SWIPE_RIGHT, SWIPE_UP, SWIPE_DOWN } = swipeDirections;
    const { dx, dy } = gestureState;

    if (!swipeLengthThreshold) {
      return;
    }

    if (this._isValidHorizontalSwipe(gestureState)) {
      if (Math.abs(dx) > swipeLengthThreshold) {
        return dx > 0 ? SWIPE_RIGHT : SWIPE_LEFT;
      }
    } else if (this._isValidVerticalSwipe(gestureState)) {
      if (Math.abs(dy) > swipeLengthThreshold) {
        return dy > 0 ? SWIPE_DOWN : SWIPE_UP;
      }
    }

    return null;
  }

  /**
   * Checks, whether the swipe was done in a horizontal fashion, respecting swipeVelocityThreshold limits
   *
   * @param gestureState
   * @returns {*}
   *
   * @private
   */
  _isValidHorizontalSwipe(gestureState) {
    const { vx, dy } = gestureState;
    const { swipeVelocityThreshold, swipeDirectionalThreshold } = this.props;
    return this._isValidSwipe(
      vx,
      swipeVelocityThreshold,
      dy,
      swipeDirectionalThreshold
    );
  }

  /**
   * Checks, whether the swipe was done in a vertical fashion, respecting swipeVelocityThreshold limits
   *
   * @param gestureState
   * @returns {*}
   *
   * @private
   */
  _isValidVerticalSwipe(gestureState) {
    const { vy, dx } = gestureState;
    const { swipeVelocityThreshold, swipeDirectionalThreshold } = this.props;
    return this._isValidSwipe(
      vy,
      swipeVelocityThreshold,
      dx,
      swipeDirectionalThreshold
    );
  }

  /**
   * Checks the sipw against velocity and directional offset to make sure it only gets activated, when we actually need it
   *
   * @param velocity
   * @param swipeVelocityThreshold
   * @param directionalOffset
   * @param swipeDirectionalThreshold
   *
   * @returns {boolean}
   *
   * @private
   */
  _isValidSwipe(
    velocity,
    swipeVelocityThreshold,
    directionalOffset,
    swipeDirectionalThreshold
  ) {
    return (
      Math.abs(velocity) > swipeVelocityThreshold &&
      Math.abs(directionalOffset) < swipeDirectionalThreshold
    );
  }

  render() {
    return (
      <ReactNativeZoomableView
        {...this.props}
        ref={this.zoomableViewRef}
        onShiftingEnd={this._onShiftingEnd}
      />
    );
  }
}
export default ReactNativeZoomableViewWithGestures;
