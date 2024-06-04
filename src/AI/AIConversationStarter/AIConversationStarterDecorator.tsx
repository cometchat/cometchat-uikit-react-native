import React from "react";
import { TouchableOpacity, View, Text, ScrollView } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatTheme, CometChatUIEventHandler, CometChatUIEvents, DataSource, DataSourceDecorator, MessageEvents, localize } from "../../shared";
import { MessageStatusConstants, ReceiverTypeConstants, ViewAlignment } from "../../shared/constants/UIKitConstants";

import { getCardViewStyle, getRepliesWrapperStyle, getRepliesStyle } from "./style";
import { State } from "../utils";
import { AIConversationStarterConfiguration } from "./configuration";
import { CardViewStyle } from "../CardViewStyle";
import CometChatAICard from "../../shared/views/CometChatAICard/CometChatAICard";
export class AIConversationStarterDecorator extends DataSourceDecorator {
  public configuration?: AIConversationStarterConfiguration;
  public currentMessage: CometChat.BaseMessage | null = null;
  public loggedInUser!: CometChat.User | null;
  messageListenerId = 'message_' + new Date().getTime();
  public user!: CometChat.User;
  public group!: CometChat.Group;
  public cardViewStyle: CardViewStyle = {};
  public errorStateText: string = localize("SOMETHING_WRONG");
  public emptyStateText: string = localize("NO_MESSAGES_FOUND");
  public theme: CometChatTheme;
  constructor(dataSource: DataSource, configuration?: AIConversationStarterConfiguration) {

    super(dataSource);

    this.configuration = configuration;

    setTimeout(() => {
      this.listeners();
    }, 1000);
  }
  override getId(): string {
    return "aiconversationstarter";
  }

  private loadConversationStarter(): void {
    this.getConversationStarter()
      .then((replies) => {
        if (!replies || (replies?.length && replies.length <= 0)) {
          this.showDefaultPanel(State.empty)
        }
        else {
          CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
            alignment: ViewAlignment.composerTop,
            child: () => (
              <View style={{ boxShadow: this.cardViewStyle?.boxShadow, width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 130, backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius: this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border }}>
                <ScrollView style={{ height: "100%", width: "100%" }}>
                  {replies}
                </ScrollView>
              </View>
            ),
          });
        }

      })
      .catch((err) => {
        console.log(err);
        this.showDefaultPanel(State.error)

      })
  }

  private getLoadingView(): JSX.Element {
    let LoadingView: JSX.Element = this.configuration?.LoadingStateView
    return (
      <CometChatAICard
        state={State.loading}
        style={this.configuration?.conversationStarterStyle}
        loadingIconURL={this.configuration?.loadingIconURL}// || loadingIconURL}
        loadingStateText={localize("GENERATIONG_ICEBREAKER")}
      >
        {LoadingView ? <LoadingView /> : null}
      </CometChatAICard>
    )
  }

  private getEmptyView(): JSX.Element {
    let EmptyView: JSX.Element = this.configuration?.EmptyStateView
    return (
      <CometChatAICard
        state={State.empty}
        style={this.configuration?.conversationStarterStyle}
        emptyIconURL={this.configuration?.emptyIconURL}// || emptyIcon}
        emptyStateText={this.emptyStateText}
      >
        {EmptyView ? <EmptyView /> : null}
      </CometChatAICard>
    )
  }

  private getErrorView(error?: CometChat.CometChatException): JSX.Element {
    return (
      <CometChatAICard
        state={State.error}
        style={this.configuration?.conversationStarterStyle}
        errorIconURL={this.configuration?.errorIconURL}// || errorIcon}
        errorStateText={this.errorStateText}
      >
        {this.configuration?.ErrorStateView ? this.configuration?.ErrorStateView(error) : null}
      </CometChatAICard>
    )
  }

  showDefaultPanel(state: State = State.loading, error?: CometChat.CometChatException) {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
      alignment: ViewAlignment.composerTop,
      child: () => (
        <View style={{ width: this.cardViewStyle?.width || "100%", height: 'auto', backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius: this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border, justifyContent: "center", alignItems: "center" }}>
          {state == State.loading ? this.getLoadingView()
            : state == State.empty ? this.getEmptyView() : this.getErrorView(error)
          }
        </View>

      ),
    });
  }

  editReply(reply: string) {
    this.closePanel();
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccComposeMessage, { text: reply });
  }

  closePanel = () => {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.composerTop,
      child: () => (null),
    });
  }

  closeIfMessageReceived(message) {
    if (message?.receiverId == this.loggedInUser?.uid) {
      this.closePanel()
    }
  }

  getConversationStarter(): Promise<JSX.Element> {
    return new Promise((resolve, reject) => {
      let receiverId: string = this.user ? this.user?.getUid() : this.group?.getGuid();
      let receiverType: string = this.user ? ReceiverTypeConstants.user : ReceiverTypeConstants.group;
      if (this.configuration?.customView) {
        CometChat.getConversationStarter(receiverId, receiverType).then((response: any) => {
          this.configuration.customView(response).then((res) => {
            return resolve((<View>{res}</View>))
          })
            .catch((err: CometChat.CometChatException) => {
              return reject(err)
            })
        })
          .catch((err: CometChat.CometChatException) => {
            return reject(err)
          })
      }
      else {
        CometChat.getConversationStarter(receiverId, receiverType).then((response: any) => {
          let view: JSX.Element[] = [];
          Object.keys(response).forEach((reply) => {
            if (response[reply] && response[reply] != "") {
              view.push(
                (<TouchableOpacity
                  style={getRepliesWrapperStyle(this.theme, this.configuration?.conversationStarterStyle)}
                  key={response[reply]}
                  onPress={() => this.editReply(response[reply])}
                >
                  <Text style={getRepliesStyle(this.theme, this.configuration?.conversationStarterStyle)}>{response[reply]}</Text>
                </TouchableOpacity>)
              )
            }
          })
          return resolve((<View>{view}</View>))
        })
          .catch((err: CometChat.CometChatException) => {
            return reject(err)
          })
      }

    })
  }

  attachMessageListener() {
    this.cardViewStyle = getCardViewStyle(this.theme, this.configuration?.conversationStarterStyle)
    CometChatUIEventHandler.addMessageListener(
      this.messageListenerId,
      {
        onTextMessageReceived: (textMessage) => {
          this.closeIfMessageReceived(textMessage)
        },
        onMediaMessageReceived: (mediaMessage) => {
          this.closeIfMessageReceived(mediaMessage)
        },
        onCustomMessageReceived: (customMessage) => {
          this.closeIfMessageReceived(customMessage)
        },
        onFormMessageReceived: (formMessage) => {
          this.closeIfMessageReceived(formMessage)
        },
        onCardMessageReceived: (cardMessage) => {
          this.closeIfMessageReceived(cardMessage)
        },
        onCustomInteractiveMessageReceived: (customInteractiveMessage) => {
          this.closeIfMessageReceived(customInteractiveMessage)
        }
      })
  }

  private listeners() {

    CometChat.getLoggedinUser()
      .then((u) => {
        this.loggedInUser = u;
      })
      .catch((err) => console.log(err));

    CometChatUIEventHandler.addMessageListener(
      MessageEvents.ccActiveChatChanged + "_STARTER",
      {
        ccActiveChatChanged: ({ message, user, group, theme, parentMessageId }) => {
          this.user = user;
          this.group = group;
          if (theme) {
            this.theme = theme;
          }
          else {
            this.theme = new CometChatTheme({});
          }

          if (!message && !parentMessageId) {
            this.attachMessageListener()
            this.showDefaultPanel(State.loading)
            this.loadConversationStarter();
          }
        },
        ccMessageSent: ({ message, status }) => {
          if (status == MessageStatusConstants.success && message?.sender?.uid == this.loggedInUser?.uid) {
            this.closePanel();
          }
        }
      }
    );

  }
}



