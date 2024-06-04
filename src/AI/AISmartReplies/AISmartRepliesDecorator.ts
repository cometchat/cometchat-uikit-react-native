import { DataSource,DataSourceDecorator } from "../../shared";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AIButtonsStyle } from "../utils";
import { AISmartRepliesConfiguration } from "./configuration";
export class AISmartRepliesExtensionDecorator extends DataSourceDecorator {
  public configuration?:AISmartRepliesConfiguration;
  constructor(dataSource:DataSource,configuration?:AISmartRepliesConfiguration){
  super(dataSource);
  this.configuration  = configuration;
}
  override getId(): string {
    return "aismartreply";
  }
}




