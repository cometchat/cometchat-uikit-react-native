import {
  ExtensionsDataSource,
  ChatConfigurator,
  DataSource,
} from '../../shared/framework';
import { ReactionsExtensionDecorator } from './ReactionsDecorator';
import { MessageReactionsInterface } from './CometChatMessageReactions/CometChatMessageReactions';
import { ExtensionConstants } from '../ExtensionConstants';

export interface ReactionsConfigurationInterface
  extends Omit<
    MessageReactionsInterface,
    'messageObject' | 'loggedInUser' | 'updateReaction' | 'onReactionClick'
  > {}

export class ReactionsExtension extends ExtensionsDataSource {
  ReactionsConfigurationInterface?: ReactionsConfigurationInterface;

  constructor(
    ReactionsConfigurationConfiguration?: ReactionsConfigurationInterface
  ) {
    super();
    if (ReactionsConfigurationConfiguration != null) {
      this.ReactionsConfigurationInterface =
        ReactionsConfigurationConfiguration;
    }
  }

  /**
   * enable
   *  @description enables the Text moderation extension which includes Data profanity and data masking
   */

  //override addExtension method from ExtensionsDataSource interface
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: DataSource) => {
      return new ReactionsExtensionDecorator(
        dataSource,
        this.ReactionsConfigurationInterface
      );
    });
  }

  //override getExtensionId method from ExtensionsDataSource interface
  override getExtensionId(): string {
    return ExtensionConstants.reactions;
  }
}
