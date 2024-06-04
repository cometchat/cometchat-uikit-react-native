import {
  ExtensionsDataSource,
  ChatConfigurator,
  DataSource,
} from '../../shared/framework';
import { ExtensionConstants } from '../ExtensionConstants';
import { SmartRepliesDecorator } from './SmartRepliesDecorator';
import { SmartRepliesInterface } from './SmartRepliesView';
export interface SmartRepliesConfigurationInterface
  extends Omit<
    SmartRepliesInterface,
    | 'customOutgoingMessageSound'
    | 'enableSoundForMessages'
    | 'onClose'
    | 'replies'
    | 'onClick'
    | 'closeIcon'
  > {}

export class SmartRepliesExtension extends ExtensionsDataSource {
  SmartRepliesConfigurationInterface?: SmartRepliesConfigurationInterface;

  constructor(
    SmartRepliesConfigurationConfiguration?: SmartRepliesConfigurationInterface
  ) {
    super();
    if (SmartRepliesConfigurationConfiguration != null) {
      this.SmartRepliesConfigurationInterface =
        SmartRepliesConfigurationConfiguration;
    }
  }

  /**
   * enable
   *  @description enables the Text moderation extension which includes Data profanity and data masking
   */

  //override addExtension method from ExtensionsDataSource interface
  override addExtension(): void {
    ChatConfigurator.enable((dataSource: DataSource) => {
      return new SmartRepliesDecorator(
        dataSource,
        this.SmartRepliesConfigurationInterface
      );
    });
  }

  //override getExtensionId method from ExtensionsDataSource interface
  override getExtensionId(): string {
    return ExtensionConstants.smartReply;
  }
}
