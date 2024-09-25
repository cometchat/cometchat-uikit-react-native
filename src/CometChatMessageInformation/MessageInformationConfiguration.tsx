import { CometChatMessageInformationInterface } from './CometChatMessageInformation';

// Interface/Class merging: Class and Interface name should be the same. (below)
// Add a second interface for typing (if needed elsewhere)
// To avoid listing all properties individually in the class
export interface CometChatMessageInformationConfiguration
  extends Omit<
    CometChatMessageInformationInterface,
    | 'title'
    | 'message'
    | 'template'
    | 'BubbleView'
    | 'receiptDatePattern'
    | 'readIcon'
    | 'sentIcon'
    | 'deliveredIcon'
  > {}

export interface CometChatMessageInformationConfigurationInterface
  extends CometChatMessageInformationConfiguration {}

// Class name same as interface
export class CometChatMessageInformationConfiguration {
  constructor(props: CometChatMessageInformationConfigurationInterface) {
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        //@ts-ignore - Ignore dynamic property assignment type checks
        this[key] = value;
      }
    }
  }
}
