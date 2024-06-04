import {
  ExtensionsDataSource,
  ChatConfigurator,
  DataSource,
} from '../../shared/framework';
import { MessageTranslationExtensionDecorator } from './MessageTranslationDecorator';
import { MessageTranslationBubble } from './MessageTranslationBubble';
import { ExtensionConstants } from '../ExtensionConstants';

export interface MessageTranslationConfigurationInterface
  extends Omit<
    MessageTranslationBubble,
    'translatedText' | 'text' | 'alignment'
  > {}
export class MessageTranslationExtension extends ExtensionsDataSource {
  MessageTranslationConfigurationInterface?: MessageTranslationConfigurationInterface;

  constructor(
    MessageTranslationConfigurationConfiguration?: MessageTranslationConfigurationInterface
  ) {
    super();
    if (MessageTranslationConfigurationConfiguration != null) {
      this.MessageTranslationConfigurationInterface =
        MessageTranslationConfigurationConfiguration;
    }
  }

  /**
   * enable
   *  @description enables the Text moderation extension which includes Data profanity and data masking
   */
  
  //override addExtension method from ExtensionsDataSource interface
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: DataSource) => {
      return new MessageTranslationExtensionDecorator(
        dataSource,
        this.MessageTranslationConfigurationInterface
      );
    });
  }

  //override getExtensionId method from ExtensionsDataSource interface
  override getExtensionId(): string {
    return ExtensionConstants.messageTranslation;
  }
}
