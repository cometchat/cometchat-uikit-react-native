import React, { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  PanResponder,
  TouchableOpacity,
  View,
  Modal, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Styles } from './style';
import { CometChatContext } from '../../CometChatContext';
import { CometChatContextType } from '../../base/Types';

export interface CometChatBottomSheetInterface {
  sliderMaxHeight?: any;
  animationDuration?: any;
  animation?: any;
  sliderMinHeight?: number;
  children?: any;
  isOpen?: boolean;
  onOpen?: Function;
  onClose?: Function;
  style?: {
    shadowColor?: string;
    backgroundColor?: string;
    lineColor?: string;
    lineHeight?: number,
    paddingHorizontal?: number,
    borderRadius?: number,
  };
}
const CometChatBottomSheet = forwardRef((props: CometChatBottomSheetInterface, ref) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const {
    sliderMaxHeight,
    animationDuration,
    animation,
    sliderMinHeight,
    children,
    isOpen,
    onOpen,
    onClose,
    style,
  } = props;

  const [contentHeight, setContentHeight] = useState(null);
  const panelHeightValue = new Animated.Value(0);

  const togglePanel = () => {
    Animated.timing(panelHeightValue, {
      duration: animationDuration,
      easing: animation,
      toValue:
        //@ts-ignore
        panelHeightValue._value === 0 ? contentHeight - sliderMinHeight : 0,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
    return true;
  };

  useImperativeHandle(ref, () => {
    return {
      togglePanel
    };
  });
  const _onBackPress = () => {
    isOpen && togglePanel();
    return isOpen;
  };

  const _handleScrollEndDrag = ({ nativeEvent }) => {
    nativeEvent.contentOffset.y === 0 && togglePanel();
  };

  const _setSize = ({ nativeEvent }) => {
    setContentHeight(nativeEvent.layout.height);
  };

  let _parentPanResponder = PanResponder.create({
    onMoveShouldSetPanResponderCapture: () => !isOpen,
    onPanResponderRelease: () => togglePanel(),
  });

  let _childPanResponder = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gestureState) =>
      gestureState.dy > 15,
    onPanResponderRelease: (_, gestureState) =>
      gestureState.dy > 0 && togglePanel(),
  });

  useEffect(() => {

    BackHandler.addEventListener('hardwareBackPress', _onBackPress);
    // onOpen ? onOpen() : () => {};

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', _onBackPress);
    };
  }, []);

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      onRequestClose={() => togglePanel()}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={Styles.wrapperStyle}>
          <View
            style={Styles.greyWrapperStyle}
            onStartShouldSetResponder={() => togglePanel()}
          />
          <Animated.View
            onLayout={_setSize}
            {..._parentPanResponder?.panHandlers}
            style={{
              ...Styles.containerStyle,
              backgroundColor:
                style?.backgroundColor ?? theme.palette.getBackgroundColor(),
              shadowColor: style?.shadowColor ?? theme.palette.getAccent(),
              maxHeight: sliderMaxHeight,
              transform: [
                { translateY: panelHeightValue },
                { scale: isOpen ? 1 : 0 },
              ],
              paddingHorizontal: style?.paddingHorizontal || 5,
              borderTopLeftRadius: style?.borderRadius || 30,
              borderTopRightRadius: style?.borderRadius || 30,
            }}
          >
            <View
              style={Styles.outerContentStyle}
              {..._childPanResponder?.panHandlers}
            >
              <TouchableOpacity
                onPress={togglePanel.bind(this)}
                activeOpacity={1}
                style={{ height: style.lineHeight || 30 }}
              >
                <View style={Styles.lineContainerStyle}>
                  <View
                    style={[
                      Styles.lineStyle,
                      {
                        backgroundColor:
                          style?.lineColor ?? theme.palette.getAccent200(),
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
              <View style={Styles.innerContentStyle}>
                {typeof children === 'function'
                  ? children(_handleScrollEndDrag)
                  : children}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});

CometChatBottomSheet.defaultProps = {
  children: <View />,
  isOpen: true,
  sliderMaxHeight: Dimensions.get('screen').height * 0.9,
  sliderMinHeight: 50,
  animation: Easing.quad,
  animationDuration: 200,
  onOpen: null,
  onClose: null,
  style: {},
};

export { CometChatBottomSheet };
