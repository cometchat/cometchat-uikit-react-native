import React, { useMemo } from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { stopStreamingForRunId } from "../../services/stream-message.service";
import { useTheme } from "../../../theme";
import { Icon } from "../../../shared/icons/Icon";

type CometChatSendButtonViewProps = {
  isButtonDisabled: boolean;
  composerRef: any;
  isStreaming: boolean;
  showStopButton: boolean;
  setShowStopButton: (show: boolean) => void;
};

const CometChatSendButtonView = ({
  isButtonDisabled,
  composerRef,
  isStreaming,
  showStopButton,
  setShowStopButton,
}: CometChatSendButtonViewProps) => {
  const theme = useTheme();

  const handlePress = () => {
    if (isButtonDisabled) {
      return;
    }
    
    if (isStreaming || showStopButton) {
      setShowStopButton(false);
      stopStreamingForRunId();
    } else {
      setShowStopButton(true);
      setTimeout(() => {
        composerRef.current?.sendTextMessage?.();
      }, 0);
    }
  };

  const shouldShowStop = isStreaming || showStopButton;
  const isActive = shouldShowStop || !isButtonDisabled;

  const buttonStyle = useMemo<ViewStyle>(() => {
    const { spacing } = theme;
    const backgroundColor =
      theme.mode === "light"
        ? isActive
          ? theme.color.secondaryButtonBackground
          : theme.color.background4
        : isActive
        ? theme.color.staticWhite
        : theme.color.background4;

    return {
      display: "flex",
      width: spacing.spacing.s8,
      height: spacing.spacing.s8,
      padding: spacing.padding.p1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: spacing.spacing.s15,
      backgroundColor,
    } as ViewStyle;
  }, [theme, isActive]);

  const iconColor =
    theme.mode === "light"
      ? theme.color.staticWhite
      : isActive
      ? theme.color.staticBlack
      : theme.color.staticBlack;

  return (
    <TouchableOpacity
      testID="CometChatComposer.send"
      onPress={handlePress}
      disabled={isButtonDisabled && shouldShowStop}
      style={buttonStyle}
    >
      <Icon
        name={shouldShowStop ? "stop-fill" : "ai-send-button"}
        width={theme.spacing.spacing.s5}
        height={theme.spacing.spacing.s5}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

export { CometChatSendButtonView };
