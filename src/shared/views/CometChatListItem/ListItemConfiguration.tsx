import { CometChatListItemInterface } from './CometChatListItem';

export interface ListItemConfigurationInterface
  extends Omit<
    CometChatListItemInterface,
    | 'id'
    | 'avatarURL'
    | 'avatarName'
    | 'statusIndicatorColor'
    | 'statusIndicatorIcon'
    | 'title'
  > {}
export class ListItemConfiguration {
  constructor(props: ListItemConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
