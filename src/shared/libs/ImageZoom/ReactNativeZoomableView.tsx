import React, { Component, createRef, RefObject } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  InteractionManager,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from 'react-native';

import {
  Vec2D,
  ReactNativeZoomableViewProps,
  ReactNativeZoomableViewState,
  TouchPoint,
  ZoomableViewEvent,
} from './types';
import { applyPanBoundariesToOffset, calcGestureTouchDistance, calcNewScaledOffsetForZoomCentering, getBoundaryCrossedAnim, getPanMomentumDecayAnim, getZoomToAnimation } from './helper';


const initialState = {
  originalWidth: null,
  originalHeight: null,
  originalPageX: null,
  originalPageY: null,
} as ReactNativeZoomableViewState;
function calcGestureCenterPoint(
  e: GestureResponderEvent,
  gestureState: PanResponderGestureState
): Vec2D | null {
  const touches = e?.nativeEvent?.touches;
  if (!touches[0]) return null;

  if (gestureState.numberActiveTouches === 2) {
    if (!touches[1]) return null;
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  }
  if (gestureState.numberActiveTouches === 1) {
    return {
      x: touches[0].pageX,
      y: touches[0].pageY,
    };
  }

  return null;
}

class ReactNativeZoomableView extends Component<
  ReactNativeZoomableViewProps,
  ReactNativeZoomableViewState
> {
  zoomSubjectWrapperRef: RefObject<View>;
  gestureHandlers: any;
  doubleTapFirstTapReleaseTimestamp: number;

  static defaultProps = {
    zoomEnabled: true,
    panEnabled: true,
    initialZoom: 1,
    initialOffsetX: 0,
    initialOffsetY: 0,
    maxZoom: 3.5,
    minZoom: 1,
    pinchToZoomInSensitivity: 1,
    pinchToZoomOutSensitivity: 1,
    movementSensibility: 1,
    doubleTapDelay: 300,
    bindToBorders: true,
    zoomStep: 0.5,
    onLongPress: null,
    longPressDuration: 700,
    contentWidth: undefined,
    contentHeight: undefined,
    panBoundaryPadding: 0,
    disablePanOnInitialZoom: false,
  };

  private panAnim = new Animated.ValueXY({ x: 0, y: 0 });
  private zoomAnim = new Animated.Value(1);

  private __offsets = {
    x: {
      value: 0,
      boundaryCrossedAnimInEffect: false,
    },
    y: {
      value: 0,
      boundaryCrossedAnimInEffect: false,
    },
  };

  private zoomLevel = 1;
  private lastGestureCenterPosition: { x: number; y: number } = null;
  private lastGestureTouchDistance: number;
  private gestureType: 'pinch' | 'shift' | 'null';
  private gestureStarted = false;

  /**
   * Last press time (used to evaluate whether user double tapped)
   * @type {number}
   */
  private longPressTimeout: NodeJS.Timeout = null;
  private onTransformInvocationInitialized: boolean;
  private singleTapTimeoutId: NodeJS.Timeout;
  private touches: TouchPoint[] = [];
  private doubleTapFirstTap: TouchPoint;
  private measureZoomSubjectInterval: NodeJS.Timer;

  constructor(props) {
    super(props);

    this.gestureHandlers = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: (evt, gestureState) => {
        // We should also call _handlePanResponderEnd
        // to properly perform cleanups when the gesture is terminated
        // (aka gesture handling responsibility is taken over by another component).
        // This also fixes a weird issue where
        // on real device, sometimes onPanResponderRelease is not called when you lift 2 fingers up,
        // but onPanResponderTerminate is called instead for no apparent reason.
        this._handlePanResponderEnd(evt, gestureState);
        this.props.onPanResponderTerminate?.(
          evt,
          gestureState,
          this._getZoomableViewEventObject()
        );
      },
      onPanResponderTerminationRequest: (evt, gestureState) =>
        !!this.props.onPanResponderTerminationRequest?.(
          evt,
          gestureState,
          this._getZoomableViewEventObject()
        ),
      // Defaults to true to prevent parent components, such as React Navigation's tab view, from taking over as responder.
      onShouldBlockNativeResponder: (evt, gestureState) =>
        this.props.onShouldBlockNativeResponder?.(
          evt,
          gestureState,
          this._getZoomableViewEventObject()
        ) ?? true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) =>
        this.props.onStartShouldSetPanResponderCapture?.(evt, gestureState),
      onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
        this.props.onMoveShouldSetPanResponderCapture?.(evt, gestureState),
    });

    this.zoomSubjectWrapperRef = createRef<View>();

    if (this.props.zoomAnimatedValue)
      this.zoomAnim = this.props.zoomAnimatedValue;
    if (this.props.panAnimatedValueXY)
      this.panAnim = this.props.panAnimatedValueXY;

    this.zoomLevel = props.initialZoom;
    this.offsetX = props.initialOffsetX;
    this.offsetY = props.initialOffsetY;

    this.panAnim.setValue({ x: this.offsetX, y: this.offsetY });
    this.zoomAnim.setValue(this.zoomLevel);
    this.panAnim.addListener(({ x, y }) => {
      this.offsetX = x;
      this.offsetY = y;
    });
    this.zoomAnim.addListener(({ value }) => {
      this.zoomLevel = value;
    });

    this.state = {
      ...initialState,
    };

    this.lastGestureTouchDistance = 150;

    this.gestureType = null;
  }

  private set offsetX(x: number) {
    this.__setOffset('x', x);
  }
  private set offsetY(y: number) {
    this.__setOffset('y', y);
  }
  private get offsetX() {
    return this.__getOffset('x');
  }
  private get offsetY() {
    return this.__getOffset('y');
  }
  private __setOffset(axis: 'x' | 'y', offset) {
    const offsetState = this.__offsets[axis];
    const animValue = this.panAnim?.[axis];

    if (this.props.bindToBorders) {
      const containerSize =
        axis === 'x' ? this.state?.originalWidth : this.state?.originalHeight;
      const contentSize =
        axis === 'x'
          ? this.props.contentWidth || this.state?.originalWidth
          : this.props.contentHeight || this.state?.originalHeight;

      const boundOffset =
        contentSize && containerSize
          ? applyPanBoundariesToOffset(
              offset,
              containerSize,
              contentSize,
              this.zoomLevel,
              this.props.panBoundaryPadding
            )
          : offset;

      if (
        animValue &&
        !this.gestureType &&
        !offsetState.boundaryCrossedAnimInEffect
      ) {
        const boundariesApplied =
          boundOffset !== offset &&
          boundOffset.toFixed(3) !== offset.toFixed(3);
        if (boundariesApplied) {
          offsetState.boundaryCrossedAnimInEffect = true;
          getBoundaryCrossedAnim(this.panAnim[axis], boundOffset).start(() => {
            offsetState.boundaryCrossedAnimInEffect = false;
          });
          return;
        }
      }
    }

    offsetState.value = offset;
  }
  private __getOffset(axis: 'x' | 'y') {
    return this.__offsets[axis].value;
  }

  componentDidUpdate(
    prevProps: ReactNativeZoomableViewProps,
    prevState: ReactNativeZoomableViewState
  ) {
    const { zoomEnabled, initialZoom } = this.props;
    if (prevProps.zoomEnabled && !zoomEnabled) {
      this.zoomLevel = initialZoom;
      this.zoomAnim.setValue(this.zoomLevel);
    }
    if (
      !this.onTransformInvocationInitialized &&
      this._invokeOnTransform().successful
    ) {
      this.panAnim.addListener(() => this._invokeOnTransform());
      this.zoomAnim.addListener(() => this._invokeOnTransform());
      this.onTransformInvocationInitialized = true;
    }

    const currState = this.state;
    const originalMeasurementsChanged =
      currState.originalHeight !== prevState.originalHeight ||
      currState.originalWidth !== prevState.originalWidth ||
      currState.originalPageX !== prevState.originalPageX ||
      currState.originalPageY !== prevState.originalPageY;

    if (this.onTransformInvocationInitialized && originalMeasurementsChanged) {
      this._invokeOnTransform();
    }
  }

  componentDidMount() {
    this.grabZoomSubjectOriginalMeasurements();
    // We've already run `grabZoomSubjectOriginalMeasurements` at various events
    // to make sure the measurements are promptly updated.
    // However, there might be cases we haven't accounted for, especially when
    // native processes are involved. To account for those cases,
    // we'll use an interval here to ensure we're always up-to-date.
    // The `setState` in `grabZoomSubjectOriginalMeasurements` won't trigger a rerender
    // if the values given haven't changed, so we're not running performance risk here.
    this.measureZoomSubjectInterval = setInterval(
      this.grabZoomSubjectOriginalMeasurements,
      1e3
    );
  }

  componentWillUnmount() {
    clearInterval(this.measureZoomSubjectInterval);
  }

  /**
   * try to invoke onTransform
   * @private
   */
  _invokeOnTransform() {
    const zoomableViewEvent = this._getZoomableViewEventObject();

    if (!zoomableViewEvent.originalWidth || !zoomableViewEvent.originalHeight)
      return { successful: false };

    this.props.onTransform?.(zoomableViewEvent);

    return { successful: true };
  }

  /**
   * Returns additional information about components current state for external event hooks
   *
   * @returns {{}}
   * @private
   */
  _getZoomableViewEventObject(overwriteObj = {}): ZoomableViewEvent {
    return {
      zoomLevel: this.zoomLevel,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      originalHeight: this.state.originalHeight,
      originalWidth: this.state.originalWidth,
      originalPageX: this.state.originalPageX,
      originalPageY: this.state.originalPageY,
      ...overwriteObj,
    } as ZoomableViewEvent;
  }

  /**
   * Get the original box dimensions and save them for later use.
   * (They will be used to calculate boxBorders)
   *
   * @private
   */
  private grabZoomSubjectOriginalMeasurements = () => {
    // make sure we measure after animations are complete
    InteractionManager.runAfterInteractions(() => {
      // this setTimeout is here to fix a weird issue on iOS where the measurements are all `0`
      // when navigating back (react-navigation stack) from another view
      // while closing the keyboard at the same time
      setTimeout(() => {
        // In normal conditions, we're supposed to measure zoomSubject instead of its wrapper.
        // However, our zoomSubject may have been transformed by an initial zoomLevel or offset,
        // in which case these measurements will not represent the true "original" measurements.
        // We just need to make sure the zoomSubjectWrapper perfectly aligns with the zoomSubject
        // (no border, space, or anything between them)
        const zoomSubjectWrapperRef = this.zoomSubjectWrapperRef;
        // we don't wanna measure when zoomSubjectWrapperRef is not yet available or has been unmounted
        zoomSubjectWrapperRef.current?.measureInWindow(
          (x, y, width, height) => {
            this.setState({
              originalWidth: width,
              originalHeight: height,
              originalPageX: x,
              originalPageY: y,
            });
          }
        );
      });
    });
  };

  /**
   * Handles the start of touch events and checks for taps
   *
   * @param e
   * @param gestureState
   * @returns {boolean}
   *
   * @private
   */
  _handleStartShouldSetPanResponder = (
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => {
    if (this.props.onStartShouldSetPanResponder) {
      this.props.onStartShouldSetPanResponder(
        e,
        gestureState,
        this._getZoomableViewEventObject(),
        false
      );
    }

    // Always set pan responder on start
    // of gesture so we can handle tap.
    // "Pan threshold validation" will be handled
    // in `onPanResponderMove` instead of in `onMoveShouldSetPanResponder`
    return true;
  };

  /**
   * Calculates pinch distance
   *
   * @param e
   * @param gestureState
   * @private
   */
  _handlePanResponderGrant = (e, gestureState) => {
    if (this.props.onLongPress) {
      this.longPressTimeout = setTimeout(() => {
        this.props.onLongPress?.(
          e,
          gestureState,
          this._getZoomableViewEventObject()
        );
        this.longPressTimeout = null;
      }, this.props.longPressDuration);
    }

    this.props.onPanResponderGrant?.(
      e,
      gestureState,
      this._getZoomableViewEventObject()
    );

    this.panAnim.stopAnimation();
    this.zoomAnim.stopAnimation();
    this.gestureStarted = true;
  };

  /**
   * Handles the end of touch events
   *
   * @param e
   * @param gestureState
   *
   * @private
   */
  _handlePanResponderEnd = (e, gestureState) => {
    if (!this.gestureType) {
      this._resolveAndHandleTap(e);
    }


    this.lastGestureCenterPosition = null;

    // Trigger final shift animation unless panEnabled is false or disablePanOnInitialZoom is true and we're on the initial zoom level
    if (
      this.props.panEnabled &&
      !(
        this.gestureType === 'shift' &&
        this.props.disablePanOnInitialZoom &&
        this.zoomLevel === this.props.initialZoom
      )
    ) {
      getPanMomentumDecayAnim(this.panAnim, {
        x: gestureState.vx / this.zoomLevel,
        y: gestureState.vy / this.zoomLevel,
      }).start();
    }

    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }

    this.props.onPanResponderEnd?.(
      e,
      gestureState,
      this._getZoomableViewEventObject()
    );

    if (this.gestureType === 'pinch') {
      this.props.onZoomEnd?.(
        e,
        gestureState,
        this._getZoomableViewEventObject()
      );
    } else if (this.gestureType === 'shift') {
      this.props.onShiftingEnd?.(
        e,
        gestureState,
        this._getZoomableViewEventObject()
      );
    }

    this.gestureType = null;
    this.gestureStarted = false;
  };

  /**
   * Handles the actual movement of our pan responder
   *
   * @param e
   * @param gestureState
   *
   * @private
   */
  _handlePanResponderMove = (
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => {
    if (this.props.onPanResponderMove) {
      if (
        this.props.onPanResponderMove(
          e,
          gestureState,
          this._getZoomableViewEventObject()
        )
      ) {
        return false;
      }
    }

    // Only supports 2 touches and below,
    // any invalid number will cause the gesture to end.
    if (gestureState.numberActiveTouches <= 2) {
      if (!this.gestureStarted) {
        this._handlePanResponderGrant(e, gestureState);
      }
    } else {
      if (this.gestureStarted) {
        this._handlePanResponderEnd(e, gestureState);
      }
      return true;
    }

    if (gestureState.numberActiveTouches === 2) {
      if (this.longPressTimeout) {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;
      }

      // change some measurement states when switching gesture to ensure a smooth transition
      if (this.gestureType !== 'pinch') {
        this.lastGestureCenterPosition = calcGestureCenterPoint(
          e,
          gestureState
        );
        this.lastGestureTouchDistance = calcGestureTouchDistance(
          e,
          gestureState
        );
      }
      this.gestureType = 'pinch';
      this._handlePinching(e, gestureState);
    } else if (gestureState.numberActiveTouches === 1) {
      if (
        this.longPressTimeout &&
        (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5)
      ) {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;
      }
      // change some measurement states when switching gesture to ensure a smooth transition
      if (this.gestureType !== 'shift') {
        this.lastGestureCenterPosition = calcGestureCenterPoint(
          e,
          gestureState
        );
      }

      const { dx, dy } = gestureState;
      const isShiftGesture = Math.abs(dx) > 2 || Math.abs(dy) > 2;
      if (isShiftGesture) {
        this.gestureType = 'shift';
        this._handleShifting(gestureState);
      }
    }
  };

  /**
   * Handles the pinch movement and zooming
   *
   * @param e
   * @param gestureState
   *
   * @private
   */
  _handlePinching(
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) {
    if (!this.props.zoomEnabled) return;

    const {
      maxZoom,
      minZoom,
      pinchToZoomInSensitivity,
      pinchToZoomOutSensitivity,
    } = this.props;

    const distance = calcGestureTouchDistance(e, gestureState);

    if (
      this.props.onZoomBefore &&
      this.props.onZoomBefore(
        e,
        gestureState,
        this._getZoomableViewEventObject()
      )
    ) {
      return;
    }

    // define the new zoom level and take zoom level sensitivity into consideration
    const zoomGrowthFromLastGestureState =
      distance / this.lastGestureTouchDistance;
    this.lastGestureTouchDistance = distance;

    const pinchToZoomSensitivity =
      zoomGrowthFromLastGestureState < 1
        ? pinchToZoomOutSensitivity
        : pinchToZoomInSensitivity;

    const deltaGrowth = zoomGrowthFromLastGestureState - 1;
    // 0 - no resistance
    // 10 - 90% resistance
    const deltaGrowthAdjustedBySensitivity =
      deltaGrowth * (1 - (pinchToZoomSensitivity * 9) / 100);

    let newZoomLevel = this.zoomLevel * (1 + deltaGrowthAdjustedBySensitivity);

    // make sure max and min zoom levels are respected
    if (maxZoom !== null && newZoomLevel > maxZoom) {
      newZoomLevel = maxZoom;
    }

    if (newZoomLevel < minZoom) {
      newZoomLevel = minZoom;
    }

    const gestureCenterPoint = calcGestureCenterPoint(e, gestureState);

    if (!gestureCenterPoint) return;

    const zoomCenter = {
      x: gestureCenterPoint.x - this.state.originalPageX,
      y: gestureCenterPoint.y - this.state.originalPageY,
    };

    const { originalHeight, originalWidth } = this.state;

    const oldOffsetX = this.offsetX;
    const oldOffsetY = this.offsetY;
    const oldScale = this.zoomLevel;
    const newScale = newZoomLevel;

    let offsetY = calcNewScaledOffsetForZoomCentering(
      oldOffsetY,
      originalHeight,
      oldScale,
      newScale,
      zoomCenter.y
    );
    let offsetX = calcNewScaledOffsetForZoomCentering(
      oldOffsetX,
      originalWidth,
      oldScale,
      newScale,
      zoomCenter.x
    );

    const offsetShift =
      this._calcOffsetShiftSinceLastGestureState(gestureCenterPoint);
    if (offsetShift) {
      offsetX += offsetShift.x;
      offsetY += offsetShift.y;
    }

    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.zoomLevel = newScale;

    this.panAnim.setValue({ x: this.offsetX, y: this.offsetY });
    this.zoomAnim.setValue(this.zoomLevel);

    this.props.onZoomAfter?.(
      e,
      gestureState,
      this._getZoomableViewEventObject()
    );
  }


  /**
   * Calculates the amount the offset should shift since the last position during panning
   *
   * @param {Vec2D} gestureCenterPoint
   *
   * @private
   */
  _calcOffsetShiftSinceLastGestureState(gestureCenterPoint: Vec2D) {
    const { movementSensibility } = this.props;

    let shift = null;

    if (this.lastGestureCenterPosition) {
      const dx = gestureCenterPoint.x - this.lastGestureCenterPosition.x;
      const dy = gestureCenterPoint.y - this.lastGestureCenterPosition.y;

      const shiftX = dx / this.zoomLevel / movementSensibility;
      const shiftY = dy / this.zoomLevel / movementSensibility;

      shift = {
        x: shiftX,
        y: shiftY,
      };
    }

    this.lastGestureCenterPosition = gestureCenterPoint;

    return shift;
  }

  /**
   * Handles movement by tap and move
   *
   * @param gestureState
   *
   * @private
   */
  _handleShifting(gestureState: PanResponderGestureState) {
    // Skips shifting if panEnabled is false or disablePanOnInitialZoom is true and we're on the initial zoom level
    if (
      !this.props.panEnabled ||
      (this.props.disablePanOnInitialZoom &&
        this.zoomLevel === this.props.initialZoom)
    ) {
      return;
    }
    const shift = this._calcOffsetShiftSinceLastGestureState({
      x: gestureState.moveX,
      y: gestureState.moveY,
    });
    if (!shift) return;

    const offsetX = this.offsetX + shift.x;
    const offsetY = this.offsetY + shift.y;


    this._setNewOffsetPosition(offsetX, offsetY);
  }

  /**
   * Set the state to offset moved
   *
   * @param {number} newOffsetX
   * @param {number} newOffsetY
   * @returns
   */
  async _setNewOffsetPosition(newOffsetX: number, newOffsetY: number) {
    const { onShiftingBefore, onShiftingAfter } = this.props;

    if (onShiftingBefore?.(null, null, this._getZoomableViewEventObject())) {
      return;
    }

    this.offsetX = newOffsetX;
    this.offsetY = newOffsetY;

    this.panAnim.setValue({ x: this.offsetX, y: this.offsetY });
    this.zoomAnim.setValue(this.zoomLevel);

    onShiftingAfter?.(null, null, this._getZoomableViewEventObject());
  }

  /**
   * Check whether the press event is double tap
   * or single tap and handle the event accordingly
   *
   * @param e
   *
   * @private
   */
  private _resolveAndHandleTap = (e: GestureResponderEvent) => {
    const now = Date.now();
    if (
      this.doubleTapFirstTapReleaseTimestamp &&
      now - this.doubleTapFirstTapReleaseTimestamp < this.props.doubleTapDelay
    ) {
      this._addTouch({
        ...this.doubleTapFirstTap,
        id: now.toString(),
        isSecondTap: true,
      });
      clearTimeout(this.singleTapTimeoutId);
      delete this.doubleTapFirstTapReleaseTimestamp;
      delete this.singleTapTimeoutId;
      delete this.doubleTapFirstTap;
      this._handleDoubleTap(e);
    } else {
      this.doubleTapFirstTapReleaseTimestamp = now;
      this.doubleTapFirstTap = {
        id: now.toString(),
        x: e.nativeEvent.pageX - this.state.originalPageX,
        y: e.nativeEvent.pageY - this.state.originalPageY,
      };
      this._addTouch(this.doubleTapFirstTap);

      // persist event so e.nativeEvent is preserved after a timeout delay
      e.persist();
      this.singleTapTimeoutId = setTimeout(() => {
        delete this.doubleTapFirstTapReleaseTimestamp;
        delete this.singleTapTimeoutId;
        this.props.onSingleTap?.(e, this._getZoomableViewEventObject());
      }, this.props.doubleTapDelay);
    }
  };

  private _addTouch(touch: TouchPoint) {
    this.touches.push(touch);
    this.setState({ touches: [...this.touches] });
  }

  private _removeTouch(touch: TouchPoint) {
    this.touches.splice(this.touches.indexOf(touch), 1);
    this.setState({ touches: [...this.touches] });
  }

  /**
   * Handles the double tap event
   *
   * @param e
   *
   * @private
   */
  _handleDoubleTap(e: GestureResponderEvent) {
    const { onDoubleTapBefore, onDoubleTapAfter, doubleTapZoomToCenter } =
      this.props;

    onDoubleTapBefore?.(e, this._getZoomableViewEventObject());

    const nextZoomStep = this._getNextZoomStep();
    const { originalPageX, originalPageY } = this.state;

    // define new zoom position coordinates
    const zoomPositionCoordinates = {
      x: e.nativeEvent.pageX - originalPageX,
      y: e.nativeEvent.pageY - originalPageY,
    };

    // if doubleTapZoomToCenter enabled -> always zoom to center instead
    if (doubleTapZoomToCenter) {
      zoomPositionCoordinates.x = 0;
      zoomPositionCoordinates.y = 0;
    }

    this._zoomToLocation(
      zoomPositionCoordinates.x,
      zoomPositionCoordinates.y,
      nextZoomStep
    ).then(() => {
      onDoubleTapAfter?.(
        e,
        this._getZoomableViewEventObject({ zoomLevel: nextZoomStep })
      );
    });
  }

  /**
   * Returns the next zoom step based on current step and zoomStep property.
   * If we are zoomed all the way in -> return to initialzoom
   *
   * @returns {*}
   */
  _getNextZoomStep() {
    const { zoomStep, maxZoom, initialZoom } = this.props;
    const { zoomLevel } = this;

    if (zoomLevel.toFixed(2) === maxZoom.toFixed(2)) {
      return initialZoom;
    }

    const nextZoomStep = zoomLevel * (1 + zoomStep);
    if (nextZoomStep > maxZoom) {
      return maxZoom;
    }

    return nextZoomStep;
  }

  /**
   * Zooms to a specific location in our view
   *
   * @param x
   * @param y
   * @param newZoomLevel
   *
   * @private
   */
  async _zoomToLocation(x: number, y: number, newZoomLevel: number) {
    if (!this.props.zoomEnabled) return;

    this.props.onZoomBefore?.(null, null, this._getZoomableViewEventObject());

    // == Perform Zoom Animation ==
    // Calculates panAnim values based on changes in zoomAnim.
    let prevScale = this.zoomLevel;
    // Since zoomAnim is calculated in native driver,
    //  it will jitter panAnim once in a while,
    //  because here panAnim is being calculated in js.
    // However the jittering should mostly occur in simulator.
    const listenerId = this.zoomAnim.addListener(({ value: newScale }) => {
      this.panAnim.setValue({
        x: calcNewScaledOffsetForZoomCentering(
          this.offsetX,
          this.state.originalWidth,
          prevScale,
          newScale,
          x
        ),
        y: calcNewScaledOffsetForZoomCentering(
          this.offsetY,
          this.state.originalHeight,
          prevScale,
          newScale,
          y
        ),
      });
      prevScale = newScale;
    });
    getZoomToAnimation(this.zoomAnim, newZoomLevel).start(() => {
      this.zoomAnim.removeListener(listenerId);
    });
    // == Zoom Animation Ends ==

    this.props.onZoomAfter?.(null, null, this._getZoomableViewEventObject());
  }

  /**
   * Zooms to a specificied zoom level.
   * Returns a promise if everything was updated and a boolean, whether it could be updated or if it exceeded the min/max zoom limits.
   *
   * @param {number} newZoomLevel
   *
   * @return {Promise<bool>}
   */
  async zoomTo(newZoomLevel: number): Promise<boolean> {
    if (
      // if we would go out of our min/max limits -> abort
      newZoomLevel > this.props.maxZoom ||
      newZoomLevel < this.props.minZoom
    )
      return false;

    await this._zoomToLocation(0, 0, newZoomLevel);
    return true;
  }

  /**
   * Zooms in or out by a specified change level
   * Use a positive number for `zoomLevelChange` to zoom in
   * Use a negative number for `zoomLevelChange` to zoom out
   *
   * Returns a promise if everything was updated and a boolean, whether it could be updated or if it exceeded the min/max zoom limits.
   *
   * @param {number | null} zoomLevelChange
   *
   * @return {Promise<bool>}
   */
  zoomBy(zoomLevelChange: number = null): Promise<boolean> {
    // if no zoom level Change given -> just use zoom step
    if (!zoomLevelChange) {
      zoomLevelChange = this.props.zoomStep;
    }

    return this.zoomTo(this.zoomLevel + zoomLevelChange);
  }

  /**
   * Moves the zoomed view to a specified position
   * Returns a promise when finished
   *
   * @param {number} newOffsetX the new position we want to move it to (x-axis)
   * @param {number} newOffsetY the new position we want to move it to (y-axis)
   *
   * @return {Promise<bool>}
   */
  moveTo(newOffsetX: number, newOffsetY: number): Promise<void> {
    const { originalWidth, originalHeight } = this.state;

    const offsetX = (newOffsetX - originalWidth / 2) / this.zoomLevel;
    const offsetY = (newOffsetY - originalHeight / 2) / this.zoomLevel;

    return this._setNewOffsetPosition(-offsetX, -offsetY);
  }

  /**
   * Moves the zoomed view by a certain amount.
   *
   * Returns a promise when finished
   *
   * @param {number} offsetChangeX the amount we want to move the offset by (x-axis)
   * @param {number} offsetChangeY the amount we want to move the offset by (y-axis)
   *
   * @return {Promise<bool>}
   */
  moveBy(offsetChangeX: number, offsetChangeY: number): Promise<void> {
    const offsetX =
      (this.offsetX * this.zoomLevel - offsetChangeX) / this.zoomLevel;
    const offsetY =
      (this.offsetY * this.zoomLevel - offsetChangeY) / this.zoomLevel;

    return this._setNewOffsetPosition(offsetX, offsetY);
  }

  render() {
    return (
      <View
        style={styles.container}
        {...this.gestureHandlers.panHandlers}
        ref={this.zoomSubjectWrapperRef}
        onLayout={this.grabZoomSubjectOriginalMeasurements}
      >
        <Animated.View
          style={[
            styles.zoomSubject,
            this.props.style,
            {
              transform: [
                { scale: this.zoomAnim },
                ...this.panAnim.getTranslateTransform(),
              ],
            },
          ]}
        >
          {this.props.children}
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  zoomSubject: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
});

export default ReactNativeZoomableView;
