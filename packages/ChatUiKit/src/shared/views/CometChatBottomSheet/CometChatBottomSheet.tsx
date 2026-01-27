import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  View,
  Easing,
  DimensionValue,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../theme";

/**
 * Props for the CometChatBottomSheet component.
 */
export interface CometChatBottomSheetInterface {
  /**
   * Content to be rendered inside the bottom sheet.
   */
  children?: any;
  /**
   * Determines whether the bottom sheet is open.
   */
  isOpen?: boolean;
  /**
   * Callback function invoked when the bottom sheet is opened.
   */
  onOpen?: Function;
  /**
   * Callback function invoked when the bottom sheet is requested to close.
   */
  onClose?: Function;
  /**
   * iOS specific callback invoked when the modal is dismissed.
   */
  onDismiss?: () => void; //iOS
  /**
   * Custom styles for the bottom sheet.
   */
  style?: {
    shadowColor?: string;
    backgroundColor?: string;
    lineColor?: string;
    lineHeight?: number;
    paddingHorizontal?: number;
    borderRadius?: number;
    paddingBottom?: number;
    maxHeight?: DimensionValue;
    minHeight?: DimensionValue;
  };
  /**
   * Enables scrolling for the bottom sheet content.
   */
  scrollEnabled?: boolean;
  /**
   * When rendering a FlatList, pass this as true to enable {height: 100%}.
   */
  doNotOccupyEntireHeight?: boolean;
}

/**
 * CometChatBottomSheet is a component that renders a modal bottom sheet.
 * It provides a customizable bottom sheet with overlay fade effect and keyboard handling.
 *
 * @param {CometChatBottomSheetInterface} props - Props for the bottom sheet component.
 * @param {React.Ref<any>} ref - Reference object to expose component methods.
 * @returns {JSX.Element} The rendered modal bottom sheet.
 */
const CometChatBottomSheet = forwardRef(
  (props: CometChatBottomSheetInterface, ref) => {
    const theme = useTheme();
    const {
      style = {
        maxHeight: Dimensions.get("screen").height * 0.9,
        minHeight: 50,
      },
      children = <View />,
      isOpen = true,
      onClose = null,
      scrollEnabled = false,
      doNotOccupyEntireHeight = false,
      onDismiss,
    } = props;

    // All hooks called unconditionally at top level
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const [isModalOpen, setIsModalOpen] = useState(isOpen);

    useEffect(() => {
      setIsModalOpen(isOpen);
    }, [isOpen]);

    // Fade in/out the overlay when isOpen changes
    useEffect(() => {
      if (isOpen) {
        // Fade from 0 -> 0.3 over 100ms
        Animated.timing(overlayAnim, {
          toValue: 0.3,
          duration: 100,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
      } else {
        // Immediately reset to 0 if closed
        overlayAnim.setValue(0);
      }
    }, [isOpen, overlayAnim]);

    /**
     * Toggles the bottom sheet panel by invoking the onClose callback.
     */
    const togglePanel = () => {
      onClose && onClose();
    };

    /**
     * Handles the hardware back button press.
     * Closes the bottom sheet if it is open.
     *
     * @returns True if the back press is handled.
     */
    const onBackPress = () => {
      if (isOpen) {
        togglePanel();
        return true; // Prevent default back behavior
      }
      return false;
    };

    useEffect(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => {
        backHandler.remove();
      };
    }, [onBackPress]);

    useImperativeHandle(ref, () => {
      return {
        togglePanel,
      };
    });

    return (
      <Modal
        animationType="fade"
        transparent={true}
        hardwareAccelerated={true}
        visible={isModalOpen}
        onRequestClose={togglePanel}
        onDismiss={onDismiss}
        supportedOrientations={["portrait", "landscape"]}
      >
        {/* Animated overlay that fades in from transparent to a semi-transparent black */}
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: overlayAnim.interpolate({
              inputRange: [0, 0.2],
              outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.35)"],
            }),
          }}
          onStartShouldSetResponder={() => {
            togglePanel();
            return true;
          }}
        />

        {/* Bottom sheet content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          enabled={Platform.OS === "ios"}
          style={{
            backgroundColor: theme.color.background1,
            paddingTop: 25,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.37,
            shadowRadius: 7.49,
            elevation: 12,
            paddingHorizontal: 5,
            maxHeight: style.maxHeight,
            minHeight: style.minHeight,
            ...(doNotOccupyEntireHeight ? {} : { height: "100%" }),
          }}
        >
          {scrollEnabled ? (
            <ScrollView
              scrollEnabled={scrollEnabled}
              keyboardShouldPersistTaps="always"
              style={{ flex: 1 }}
            >
              {typeof children === "function" ? children() : children}
            </ScrollView>
          ) : typeof children === "function" ? (
            children()
          ) : (
            children
          )}
        </KeyboardAvoidingView>
      </Modal>
    );
  }
);

export { CometChatBottomSheet };