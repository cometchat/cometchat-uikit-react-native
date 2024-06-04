import React from "react";
import { CometChatMessageComposerActionInterface, CometChatTheme, CometChatUIEventHandler, CometChatUIEvents, DataSource, DataSourceDecorator, MessageEvents, localize } from "../../shared";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { State } from "../utils";
import { AISmartRepliesConfiguration } from "./configuration";
import { AIOptionsStyle } from "../AIOptionsStyle";
import { MessageStatusConstants, ReceiverTypeConstants, ViewAlignment } from "../../shared/constants/UIKitConstants";
import { TouchableOpacity, View, Text, ScrollView, Keyboard } from "react-native";
import CometChatAICard from "../../shared/views/CometChatAICard/CometChatAICard";
import { CardViewStyle } from "../CardViewStyle";
import { getCardViewStyle, getRepliesStyle, getRepliesWrapperStyle } from "../style";
export class AISmartRepliesExtensionDecorator extends DataSourceDecorator {
  public configuration?: AISmartRepliesConfiguration;
  public user!: CometChat.User;
  public group!: CometChat.Group;
  public theme: CometChatTheme = new CometChatTheme({});
  public isPannelVisible: boolean = false;
  public repliesView: JSX.Element;
  public loadingStateText: string = localize("GENERATING_REPLIES");
  public errorStateText: string = localize("SOMETHING_WRONG");
  public emptyStateText: string = localize("NO_MESSAGES_FOUND");
  public cardViewStyle: CardViewStyle = {};
  public keyboardDidShowListener;
  public keyboardDidHideListener;
  public loggedInUser!: CometChat.User | null;
  private LISTENER_ID: string = "aismartlistener__listener";

  constructor(dataSource: DataSource, configuration?: AISmartRepliesConfiguration) {
    super(dataSource);
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.hideOnKeyboardShow);
    // this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.showOnKeyboardShow);
    this.configuration = configuration;
    this.cardViewStyle = getCardViewStyle(this.theme, this.configuration?.smartRepliesStyle)
    setTimeout(() => {
      this.addMessageListener();
    }, 1000);
  }
  override getId(): string {
    return "aismartreply";
  }

  override getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, AIOptionsStyle?: AIOptionsStyle): CometChatMessageComposerActionInterface[] {
    this.user = user!;
    this.group = group!;
    if (!id?.parentMessageId) {
      const messageComposerActions: CometChatMessageComposerActionInterface[] = super.getAIOptions(user, group, theme, id, AIOptionsStyle);
      let newAction = {
        title: localize("SUGGEST_A_REPLY"),
        onPress: () => {
          this.onButtonClick()
        },
        id: "smart-replies",
        iconURL: '',
        iconTint: '',
        titleColor: this.configuration?.smartRepliesStyle?.buttonTextColor || AIOptionsStyle.listItemTitleColor,
        titleFont: this.configuration?.smartRepliesStyle?.buttonTextFont || AIOptionsStyle.listItemTitleFont,
        background: this.configuration?.smartRepliesStyle?.backgroundColor || AIOptionsStyle.listItemBackground,
        cornerRadius: this.configuration?.smartRepliesStyle?.buttonBorderRadius || AIOptionsStyle.listItemBorderRadius,
      };
      messageComposerActions.push(newAction);
      return messageComposerActions;
    } else {
      return super.getAIOptions(user, group, theme, id, AIOptionsStyle);
    }
  }


  private getLoadingView(): JSX.Element {
    let LoadingView: JSX.Element = this.configuration?.LoadingStateView;
    return (
      <CometChatAICard
        state={State.loading}
        style={this.configuration?.smartRepliesStyle}
        loadingIconURL={this.configuration?.loadingIconURL}
        loadingStateText={this.loadingStateText}
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
        style={this.configuration?.smartRepliesStyle}
        emptyIconURL={this.configuration?.emptyIconURL}
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
        style={this.configuration?.smartRepliesStyle}
        errorIconURL={this.configuration?.errorIconURL}
        errorStateText={this.errorStateText}
      >
        {this.configuration?.ErrorStateView ? this.configuration?.ErrorStateView(error) : null}
      </CometChatAICard>
    )
  }

  editReply(reply: string) {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => (null),
    });
    this.isPannelVisible = false;
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccComposeMessage, { text: reply });
    this.keyboardDidShowListener?.remove();
    this.keyboardDidHideListener?.remove();
  }

  hideOnKeyboardShow = () => {
    if (this.isPannelVisible) {
      CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
        alignment: ViewAlignment.composerBottom,
        child: () => (null),
      });
    }
  }

  showOnKeyboardShow = () => {
    if (this.isPannelVisible) {
      CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
        alignment: ViewAlignment.composerBottom,
        child: () => this.repliesView,
      });
    }
  }

  getSmartReplies(): Promise<JSX.Element> {
    return new Promise((resolve, reject) => {
      let receiverId: string = this.user ? this.user?.getUid() : this.group?.getGuid();
      let receiverType: string = this.user ? ReceiverTypeConstants.user : ReceiverTypeConstants.group;
      if (this.configuration?.customView) {
        CometChat.getSmartReplies(receiverId, receiverType).then((response: any) => {
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
        CometChat.getSmartReplies(receiverId, receiverType).then((response: any) => {
          let view: JSX.Element[] = []
          Object.keys(response).forEach((reply) => {
            if (response[reply] && response[reply] != "") {
              view.push(
                (<TouchableOpacity
                  style={getRepliesWrapperStyle(this.theme, this.configuration?.smartRepliesStyle, this.configuration?.listItemStyle)}
                  key={response[reply]} // Make sure to set a unique key for each item
                  onPress={() => this.editReply(response[reply])}
                >
                  <Text style={getRepliesStyle(this.theme, this.configuration?.smartRepliesStyle, this.configuration?.listItemStyle)}>{response[reply]}</Text>
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

  onButtonClick = (): void => {
    this.showDefaultPanel(State.loading)
    this.getSmartReplies().then((replies) => {
      if (!replies || (replies?.length && replies.length <= 0)) {
        this.showDefaultPanel(State.empty)
      }
      else {
        this.repliesView = (<View style={{ width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 200, backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius: this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border, marginTop: 8 }}>
          <ScrollView style={{ height: "100%", width: "100%" }}>
            {replies}
          </ScrollView>


        </View>)
        CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
          alignment: ViewAlignment.composerBottom,
          child: () => this.repliesView,
        });
      }

      this.isPannelVisible = true

    })
      .catch((err) => {
        this.showDefaultPanel(State.error, err)

      })
  }

  showDefaultPanel(state: State = State.loading, error?: CometChat.CometChatException) {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => (
        <View
          style={{
            width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 160,
            backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius: this.cardViewStyle?.borderRadius,
            ...this.cardViewStyle?.border,
            justifyContent: "center", alignItems: "center"
          }}
        >
          {state == State.loading ? this.getLoadingView() : (state == State.empty ? this.getEmptyView() : this.getErrorView(error))}
        </View>
      )
    });

    this.isPannelVisible = true;
  }

  closePanel = () => {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => (null),
    });
  };
  
  closeIfMessageReceived(message: CometChat.BaseMessage) {
    if (message?.getReceiverId() === this.loggedInUser?.getUid()) {
      this.closePanel();
    }
  }

  private addMessageListener(): void {
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      if (user) {
        this.loggedInUser = user;
      }
    });

    CometChatUIEventHandler.addMessageListener(this.LISTENER_ID, {
      onTextMessageReceived: (message: CometChat.TextMessage) => {
        this.closeIfMessageReceived(message);
      },
      onCustomMessageReceived: (message: CometChat.CustomMessage) => {
        this.closeIfMessageReceived(message);
      },
      onMediaMessageReceived: (message: CometChat.MediaMessage) => {
        this.closeIfMessageReceived(message);
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
    });

    CometChatUIEventHandler.addMessageListener(
      MessageEvents.ccActiveChatChanged + "_AISmartReplies",
      {
        ccActiveChatChanged: (data) => {
          // console.log("_________ACTIVE CHAT CHANGED IN AI CONVERSATION SUMMARY")
          // this.currentMessage = data.message!;
          // this.user = data.user!;
          // this.group = data.group!;
          // this.unreadMessageCount = data.unreadMessageCount ?? 0;
          // if (this.unreadMessageCount >= (this.configuration?.unreadMessageThreshold ?? 30)) {
          //   this.loadConversationSummary();
          // }
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




