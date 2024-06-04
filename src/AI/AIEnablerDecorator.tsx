import { CometChat } from "@cometchat/chat-sdk-react-native";
import { DataSourceDecorator, DataSource, CometChatTheme, CometChatUIEvents, localize, CometChatUIEventHandler, CometChatBottomSheet, FontStyleInterface, BorderStyleInterface, BaseStyle } from "../shared";
import { CometChatButton } from "../shared/views/CometChatButton";

import { CardView, Card } from "./CardView";
import { CardViewStyle } from "./CardViewStyle";
import { getRepliesWrapperStyle, getRepliesStyle, getCardViewStyle, getButtonStyles, getPopoverStyle, defaultViewStyle, viewContainerStyle, emptyLabelStyle, errorLabelStyle, getloadingStateStyle } from "./style";
import { ReceiverTypeConstants, ViewAlignment } from "../shared/constants/UIKitConstants";
import { Image, TouchableOpacity, View, Text, ScrollView, Keyboard } from "react-native";
import React, { useEffect, useRef, useState, JSX ,useContext} from "react";
import { AIBotIcon,loadingIcon,emptyIcon,errorIcon } from './resources';
import { CometChatContext } from "../shared/CometChatContext";
import { AIEnablerConfiguration } from "./configuration";
import { AIConfigurations, ICard, State } from "./utils";
import { AIConversationStarterConfiguration } from "./AIConversationStarter/configuration";
import { AISmartRepliesConfiguration } from "./AISmartReplies/configuration";

export class AIEnablerDecorator extends DataSourceDecorator {
  smartReplyConfiguration: AISmartRepliesConfiguration = new AISmartRepliesConfiguration({});
  conversationStarterConfiguration: AIConversationStarterConfiguration = new AIConversationStarterConfiguration({});
  features?: AIConfigurations = {};
  configuration?: AIEnablerConfiguration = new AIEnablerConfiguration({});
  public newDataSource!: DataSource;
  public showAiButton: boolean = false;
  public theme!: CometChatTheme;
  public id: any;
  public user!: CometChat.User;
  public group!: CometChat.Group;
  public loggedInUser!: CometChat.User | null;
  public cardViewStyle: CardViewStyle = {};
  public buttonRef: any;
  public setCallback: any;
  public isPannelVisible:boolean = false;
  public repliesView:JSX.Element;
  public errorStateText:string = localize("SOMETHING_WRONG");
public emptyStateText:string = localize("NO_MESSAGES_FOUND");
public keyboardDidShowListener;
public keyboardDidHideListener;
  onButtonClick = (id: string): void => {
    if (id == "smart-replies") {
      this.showDefaultPanel(State.loading)
      this.getSmartReplies().then((replies) => {
        if(!replies || (replies?.length && replies.length <= 0)){
          this.showDefaultPanel(State.empty)
        }
        else{
          this.repliesView =       (  <View style={{ width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 200, backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius:this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border, marginTop: 8 }}>
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
          this.showDefaultPanel(State.error,err)

        })
    }
  }
  public cardsData: ICard = {}
  constructor(dataSource: DataSource, features?: AIConfigurations, configuration?: AIEnablerConfiguration) {
    super(dataSource);
     this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.hideOnKeyboardShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.showOnKeyboardShow);
    if (configuration) {
      this.configuration = configuration;
    }
    this.newDataSource = dataSource;
    this.features = features;
    CometChat.getLoggedinUser().then(
      (user: CometChat.User | null) => {
        if (user) {
          this.loggedInUser = user
        }
      }
    );
  }
  getDataSource() {
    return this.newDataSource;
  }
  getId(): string {
    return "aienabler";
  }
hideOnKeyboardShow = () => {
if(this.isPannelVisible){
  CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
    alignment: ViewAlignment.composerBottom,
    child: () => (null),
  });
}
}
showOnKeyboardShow = () => {
  if(this.isPannelVisible){
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => this.repliesView,
    });
  }
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
  closeBottomsheet = () => {
    if (this.setCallback) {
      this.setCallback(false)
    }
  }

  getSmartReplies(): Promise<JSX.Element> {
    return new Promise((resolve, reject) => {
      let receiverId: string = this.user ? this.user?.getUid() : this.group?.getGuid();
      let receiverType: string = this.user ? ReceiverTypeConstants.user : ReceiverTypeConstants.group;
      if (this.smartReplyConfiguration?.customView) {
        CometChat.getSmartReplies(receiverId, receiverType).then((response: any) => {
          this.smartReplyConfiguration.customView(response, this.closeBottomsheet).then((res)=>{
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
      else if (this.smartReplyConfiguration?.onClick) {
        this.smartReplyConfiguration?.onClick(this.user, this.group).then((response: any) => {
          return resolve((<View>{response}</View>))
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
                  style={getRepliesWrapperStyle(this.theme, this.smartReplyConfiguration?.smartRepliesStyle, this.configuration?.listItemStyle)}
                  key={response[reply]} // Make sure to set a unique key for each item
                  onPress={() => this.editReply(response[reply])}
                >
                  <Text style={getRepliesStyle(this.theme, this.smartReplyConfiguration?.smartRepliesStyle, this.configuration?.listItemStyle)}>{response[reply]}</Text>
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

  showDefaultPanel(state:State = State.loading, error?:CometChat.CometChatException) {
    this.closeBottomsheet()
    let LoadingView:JSX.Element =  this.smartReplyConfiguration?.LoadingStateView || this.configuration.LoadingStateView
    let EmptyView:JSX.Element = this.smartReplyConfiguration?.EmptyStateView  || this.configuration.EmptyStateView
    let ErrorView:JSX.Element = this.smartReplyConfiguration?.ErrorStateView  || this.configuration.ErrorStateView

    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => (
        <View style={{ width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 160, backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius:this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border, justifyContent: "center", alignItems: "center" }}>
         {state == State.loading ? LoadingView ? <LoadingView/> :  <View style={{ width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 160, backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius:this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border, justifyContent: "center", alignItems: "center" }}>
          <Image
            source={this.configuration?.loadingIconURL ?? loadingIcon}
            style={{ height: 32, width: 32,tintColor:this.cardViewStyle?.loadingIconTint}}
          />
          <Text style={getloadingStateStyle(this.theme,this.cardViewStyle, this.smartReplyConfiguration?.smartRepliesStyle)}> {localize("GENERATING_REPLIES")}</Text>
         </View>
         
          : 
         
         state == State.empty ?
          EmptyView ? <EmptyView/> : <View style={{ width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 160, backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius:this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border, justifyContent: "center", alignItems: "center" }}>
         <Image
           source={this.configuration?.emptyIconURL ?? emptyIcon}
           style={{ height: 32, width: 32,tintColor:this.cardViewStyle?.emptyIconTint}}
         />
             <Text style={emptyLabelStyle(this.cardViewStyle,this.smartReplyConfiguration.smartRepliesStyle)} > {this.emptyStateText}</Text>   
 </View> 
          : ErrorView ? ErrorView(error) :
          <View style={{ width: this.cardViewStyle?.width || "100%", height: this.cardViewStyle?.height || 160, backgroundColor: this.cardViewStyle?.backgroundColor, borderRadius:this.cardViewStyle?.borderRadius, ...this.cardViewStyle?.border, justifyContent: "center", alignItems: "center" }}>
         <Image
           source={this.configuration?.errorIconURL ?? errorIcon}
           style={{ height: 32, width: 32,tintColor:this.cardViewStyle?.errorIconTint}}
         />
                      <Text style={errorLabelStyle(this.cardViewStyle,this.smartReplyConfiguration.smartRepliesStyle)} >{this.errorStateText}</Text>
        </View> 

          }


      </View>
    
      ),
    });

    this.isPannelVisible = true;
  }


  getAuxiliaryOptions(user?: CometChat.User, group?: CometChat.Group, id?: Map<string, any>, theme?: CometChatTheme) {
    let contextTheme = useContext(CometChatContext) 
    if(contextTheme?.theme){
      this.theme  = contextTheme.theme
    }
    else{
      this.theme = theme  ||   new CometChatTheme({});
    }
    this.cardViewStyle = getCardViewStyle(this.theme, this.configuration?.listStyle,this.smartReplyConfiguration.smartRepliesStyle);
    this.id = id;
    this.user = user!;
    this.group = group!;
    let auxiliaryOptions = super.getAuxiliaryOptions(user, group, id, theme);
    this.cardsData = {
      smartReply: {
        title: localize("SUGGEST_A_REPLIES"),
        onClick: this.onButtonClick,
        id: "smart-replies",
        style: getButtonStyles(this.theme, this.smartReplyConfiguration?.smartRepliesStyle, this.configuration?.listItemStyle)

      },
      conversationStarter: {
        title: "Conversation Starter",
        onClick: this.onButtonClick,
        id: "conversation-starter",
        style: getButtonStyles(this.theme, this.conversationStarterConfiguration?.conversationStarterStyle)

      }
    };



    if (!(id as any).parentMessageId || Number((id as any).parentMessageId) <= 0 || (id as any).parentMessageId == undefined) {

      auxiliaryOptions.unshift(this.getAIAuxiliaryButton(id, user, group, theme));
    }
    return auxiliaryOptions;
  }

  getAIAuxiliaryButton(id: Map<string, any>, user?: CometChat.User, group?: CometChat.Group, theme?: CometChatTheme): JSX.Element {
    const [aiFeatures, setAiFeatures] = useState(false);
    let cards: Card[] = []
    this.setCallback = setAiFeatures
    if (this.features && Object.keys(this.features).length > 0) {
   
      if (this.features?.["smart-replies"]?.enabled) {
        this.smartReplyConfiguration = this.features?.["smart-replies"]?.configuration ?? new AISmartRepliesConfiguration({})
        cards.push(this.cardsData.smartReply!)
      }
  

    }

    return (<TouchableOpacity onPress={() => {
      CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
        alignment: ViewAlignment.composerBottom,
        child: () => (null),
      });
      if(this.isPannelVisible){
        setAiFeatures(false);
        this.isPannelVisible = false;
        return;
      }
        setAiFeatures(true);

    }} style={{ justifyContent: "center" }}>
      <Image
        source={this.configuration?.buttonIconURL ||  AIBotIcon}
        style={{ height: 32, width: 32, marginLeft: 8, marginRight: 8 , color:'red'}}
      />
      {
        <CometChatBottomSheet
          isOpen={aiFeatures}
          sliderMaxHeight={this.cardViewStyle?.height ||  350}
          onClose={() => {
            setAiFeatures(false)
          }}

        >
          <CardView
            cardViewStyle={this.cardViewStyle}
            buttons={cards}
          />
        </CometChatBottomSheet>
      }
    </TouchableOpacity>)

  }

}

