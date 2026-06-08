let __listenerIdCounter = 0;
import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import {
  ChatConfigurator,
  CometChatListItem,
  CometChatMessageTemplate,
  CometChatUIEventHandler,
  CometChatUiKitConstants,
} from "../shared";
import { MessageUtils } from "../shared/utils/MessageUtils";
import { Style } from "./styles";
import { useTheme } from "../theme";
import { CometChatDate } from "../shared/views/CometChatDate";
import { CometChatReceipt } from "../shared/views";
import { Skeleton } from "./Skeleton";
import { ErrorEmptyView } from "../shared/views/ErrorEmptyView/ErrorEmptyView";
import { MessageReceipt } from "../shared/constants/UIKitConstants";
import { CometChatTheme } from "../theme/type";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";

const listenerId = "uiEvents_" + Date.now() + "_" + (++__listenerIdCounter);

type Recipient = {
  sender: CometChat.User | CometChat.Group;
  deliveredAt: number;
  readAt: number;
  sentAt: number;
};

export interface CometChatMessageInformationInterface {
  title?: string;
  message: CometChat.BaseMessage;
  template?: CometChatMessageTemplate;
  BubbleView?: (message: CometChat.BaseMessage) => JSX.Element;
  ListItemView?: (message: CometChat.BaseMessage, receipt: Recipient) => JSX.Element;
  receiptDatePattern?: (timestamp: any) => string;
  onBack?: () => void;
  onError?: (e: CometChat.CometChatException) => void;
  EmptyStateView?: () => JSX.Element;
  emptyStateText?: string;
  ErrorStateView?: () => JSX.Element;
  errorStateText?: string;
  LoadingStateView?: () => JSX.Element;
  style?: DeepPartial<CometChatTheme["messageInformationStyles"]>;
}

/**
 * CometChatMessageInformation component renders the message information view along with message receipts.
 *
 * @param props - Properties for configuring the component.
 * @returns A JSX.Element containing the rendered message information.
 */
export const CometChatMessageInformation = (props: CometChatMessageInformationInterface) => {
  const {t} = useCometChatTranslation()
  const {
    title = t("MESSAGE_INFORMATION"),
    message,
    template,
    BubbleView,
    ListItemView,
    receiptDatePattern,
    onBack,
    onError,
    EmptyStateView,
    emptyStateText,
    ErrorStateView,
    errorStateText,
    LoadingStateView,
    style,
  } = props;

  const defaultReceiptTimestampForUser = "----";
  const theme = useTheme();
  const mergedStyle = useMemo(() => {
    return deepMerge(theme.messageInformationStyles, style ?? {});
  }, [theme, style]);

  const [receipts, setReceipts] = useState<
    Array<
      | {
          sender: CometChat.User | CometChat.Group;
          sentAt: number;
          readAt: number;
          deliveredAt: number;
        }
      | CometChat.MessageReceipt
    >
  >([]);
  const [listState, setListState] = useState<"loading" | "error" | "done">("loading");

  /**
   * Renders a receipt view for a given status and time.
   * Captures variables from the component scope (e.g. message, mergedStyle, theme).
   *
   * @param receipt - The receipt data or status identifier.
   * @param status - The receipt status (e.g. MessageReceipt.READ).
   * @param time - The timestamp for the receipt.
   * @returns A JSX.Element representing the receipt view.
   */
  const receipt = (receipt: any, status: MessageReceipt, time: any) => {
    // If a custom ListItemView is provided in props, use it.
    if (ListItemView) {
      return ListItemView(message, receipt);
    }
    const receiverTypeIsUser =
      message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.user;
    const statusTextStyle = receiverTypeIsUser
      ? mergedStyle.receiptItemStyle.titleStyle
      : mergedStyle.receiptItemStyle.subtitleStyle;
    return (
      <View style={{ flexDirection: receiverTypeIsUser ? "column" : "row" }}>
        <View
          style={{
            flexDirection: "row",
            flex: 1,
            gap:
              message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.user
                ? theme.spacing.padding.p1
                : 0,
          }}
        >
          {receiverTypeIsUser && (
            <CometChatReceipt receipt={status} style={mergedStyle.receiptItemStyle.receiptStyles} />
          )}
          <Text style={statusTextStyle}>{t(status)}</Text>
        </View>
        {time && time !== defaultReceiptTimestampForUser ? (
          receiptDatePattern ? (
            receiptDatePattern(time)
          ) : (
            <CometChatDate
              style={{ textStyle: mergedStyle.receiptItemStyle.subtitleStyle }}
              pattern="dayDateTimeFormat"
              timeStamp={time*1000}
            />
          )
        ) : (
          <Text style={mergedStyle.receiptItemStyle.subtitleStyle}>
            {defaultReceiptTimestampForUser}
          </Text>
        )}
      </View>
    );
  };

  /**
   * Renders a list of receipts for a given recipient item.
   *
   * @param item - The receipt item data.
   * @returns A JSX.Element containing the rendered receipts.
   */
  const receiptsList = (item: any) => {
    if (message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.user) {
      item.readAt = item.readAt || defaultReceiptTimestampForUser;
      item.deliveredAt = item.deliveredAt || defaultReceiptTimestampForUser;
    }
    return (
      <View
        style={{
          gap:
            message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.user
              ? theme.spacing.padding.p3
              : 0,
        }}
      >
        {item.readAt && receipt("READ", MessageReceipt.READ, item.readAt)}
        {item.deliveredAt && receipt("DELIVERED", MessageReceipt.DELIVERED, item.deliveredAt)}
      </View>
    );
  };

  /**
   * Renders each recipient as a list item.
   *
   * @param param0 - Object containing the current item and its index.
   * @returns A JSX.Element representing a single recipient list item.
   */
  const renderReceipients = useCallback(
    ({ item, index }: any) => {
      const { sender } = item;
      return (
        <CometChatListItem
          id={sender["uid"]}
          {...(message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.group
            ? { avatarName: sender["name"] }
            : {})}
          {...(message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.group
            ? { avatarURL: sender["avatar"] }
            : {})}
          SubtitleView={receiptsList(item)}
          {...(message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.group
            ? { title: sender["name"] }
            : {})}
          containerStyle={mergedStyle.receiptItemStyle.containerStyle}
          titleStyle={mergedStyle.receiptItemStyle.titleStyle}
          avatarStyle={mergedStyle.receiptItemStyle.avatarStyle}
        />
      );
    },
    [receipts, mergedStyle]
  );

  /**
   * Checks if the current message is for a group.
   *
   * @returns True if the receiver type is "group"; otherwise, false.
   */
  const isGroup = () => {
    return message?.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.group;
  };

  /**
   * Populates receipts for the current message.
   * For group messages, it fetches receipts from the server.
   * For user messages, it creates a single receipt object.
   */
  const populateReceipts = () => {
    if (isGroup()) {
      setListState("loading");
      CometChat.getMessageReceipts(message.getId())
        .then((receiptsList) => {
          setReceipts(receiptsList);
          setListState("done");
        })
        .catch((er) => {
          onError && onError(er);
          setListState("error");
        });
    } else {
      const userReceipt = {
        sender: isGroup() ? message.getSender() : message.getReceiver(),
        sentAt: message.getSentAt(),
        readAt: message.getReadAt(),
        deliveredAt: message.getDeliveredAt(),
      };
      setReceipts([userReceipt]);
    }
  };

  /**
   * Updates the message receipt when a new receipt is received.
   *
   * @param newReceipt - The new message receipt.
   */
  const updateMessageReceipt = useCallback(
    (newReceipt: CometChat.MessageReceipt) => {
      if (message.getId() === Number(newReceipt.getMessageId())) {
        if (message.getReceiverType() === CometChatUiKitConstants.ReceiverTypeConstants.user) {
          const udpatedReceipt = {
            sender: message.getReceiver(),
            sentAt: message.getSentAt(),
            readAt: message.getReadAt() || newReceipt.getReadAt(),
            deliveredAt: message.getDeliveredAt() || newReceipt.getDeliveredAt(),
          };
          setReceipts([udpatedReceipt]);
          return;
        }

        const receiptIndex = receipts.findIndex((rec) => {
          return (
            (rec as CometChat.MessageReceipt).getSender()?.getUid() ===
            newReceipt.getSender()?.getUid()
          );
        });

        if (receiptIndex > -1) {
          let oldReceipt = receipts[receiptIndex] as CometChat.MessageReceipt;
          oldReceipt.setDeliveredAt(oldReceipt.getDeliveredAt() || newReceipt.getDeliveredAt());
          oldReceipt.setReadAt(oldReceipt.getReadAt() || newReceipt.getReadAt());
          let receiptsList = [...receipts];
          receiptsList.splice(receiptIndex, 1, oldReceipt);
          setReceipts(receiptsList);
        } else {
          setReceipts([newReceipt, ...receipts]);
        }
      }
    },
    [receipts, message]
  );

  // Add listener for message delivery/read events.
  useEffect(() => {
    CometChatUIEventHandler.addMessageListener(listenerId, {
      onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
        updateMessageReceipt(messageReceipt);
      },
      onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
        updateMessageReceipt(messageReceipt);
      },
    });
    return () => CometChatUIEventHandler.removeMessageListener(listenerId);
  }, [message, receipts, updateMessageReceipt]);

  // Populate receipts when the message changes.
  useEffect(() => {
    populateReceipts();
  }, [message]);

  /**
   * Renders the loading state view.
   *
   * @returns A JSX.Element representing the loading view.
   */
  const LoadingView = () => {
    if (LoadingStateView) return <LoadingStateView />;
    return <Skeleton />;
  };

  /**
   * Renders the error state view.
   *
   * @returns A JSX.Element representing the error view.
   */
  const ErrorView = () => {
    if (ErrorStateView) return <ErrorStateView />;
    return (
      <ErrorEmptyView
        subTitle={t("WRONG_TEXT")}
        tertiaryTitle={t("WRONG_TEXT_TRY_AGAIN")}
        containerStyle={mergedStyle.errorStateStyle?.containerStyle}
        titleStyle={mergedStyle.errorStateStyle?.titleStyle}
        subTitleStyle={mergedStyle.errorStateStyle?.subtitleStyle}
      />
    );
  };

  /**
   * Renders the empty state view.
   *
   * @returns A JSX.Element representing the empty view.
   */
  const EmptyView = useCallback(() => {
    if (EmptyStateView) return <EmptyStateView />;
    return <></>;
  }, [message, receipts]);

  return (
    <View style={mergedStyle.containerStyle}>
      <View style={mergedStyle.titleContainerStyle}>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={mergedStyle.titleStyle}>{title}</Text>
        </View>
      </View>
      <View style={mergedStyle.messageBubbleContainerStyle}>
        <ScrollView>
          <View pointerEvents='none'>
            {BubbleView
              ? BubbleView(message)
              : MessageUtils.getMessageView({
                  message,
                  templates: template
                    ? [template]
                    : ChatConfigurator.dataSource.getAllMessageTemplates(theme),
                  alignment: "right",
                  theme: theme,
                })}
          </View>
        </ScrollView>
      </View>
      {listState === "loading" && receipts.length === 0 ? (
        <LoadingView />
      ) : listState === "error" && receipts.length === 0 ? (
        <ErrorView />
      ) : receipts.length === 0 ? (
        <EmptyView />
      ) : (
        <FlatList
          style={{ flex: 1, marginBottom: 50 }}
          data={receipts}
          renderItem={renderReceipients}
        />
      )}
    </View>
  );
};
