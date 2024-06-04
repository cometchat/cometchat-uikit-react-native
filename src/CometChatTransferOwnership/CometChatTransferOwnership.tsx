import { Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import {
  CometChatGroupsMembers,
  CometChatGroupsMembersInterface,
} from '../CometChatGroupMembers';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { GroupMembersStyleInterface } from '../CometChatGroupMembers/GroupMemberStyle';
import { CometChatUIEvents } from '../shared/events';
import { GroupMemberConfigurationInterface } from '../CometChatGroupMembers/GroupMemberConfiguration';
import { GroupMemberScope } from '../shared/constants/UIKitConstants';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { localize } from '../shared';

export interface CometChatTransferOwnershipInterface
  extends Omit<
    CometChatGroupsMembersInterface,
    | 'AppBarOptions'
    | 'options'
    | 'selectionMode'
    | 'onSelection'
    | 'hideError'
    | 'onItemPress'
    | 'onItemLongPress'
    | 'groupScopeStyle'
    | 'TailView'
    | 'title'
  > {
  /**
   *
   *
   * @type {string}
   * @description Title of the component
   */
  title?: string;
  /**
   *
   *
   * @description callback(group: CometChat.Group, ownershipTransferredMember: CometChat.User) => void invoked upon clicking on the submit button
   */
  onTransferOwnership?: (
    group: CometChat.Group,
    ownershipTransferredMember: CometChat.User
  ) => void;
  /**
   *
   *
   * @type {GroupMembersStyleInterface}
   * @description Styling properties of transferOwnership
   */
  transferOwnershipStyle?: GroupMembersStyleInterface;
  /**
   *
   *
   * @type {GroupMemberConfigurationInterface}
   * @description Configurable properties of GroupMembers Components
   */
  groupMembersConfiguration?: GroupMemberConfigurationInterface;
}

export const CometChatTransferOwnership = (
  props: CometChatTransferOwnershipInterface
) => {
  const {
    title = localize("TRANSFER_OWNERSHIP"),
    group,
    onTransferOwnership,
    transferOwnershipStyle,
    onError,
    onBack,
    ...newProps
  } = props;
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User>();

  const transferOwnership = (members) => {
    if(!members.length) return
    let member = members[0];
    let GUID: string = member.guid;
    let UID: string = member.uid;
    CometChat.transferGroupOwnership(GUID, UID).then(
      (ownershipTransferred: string) => {
        console.log(
          'Successfully transferred ownership of the group.',
          ownershipTransferred
        );
        group['scope'] = GroupMemberScope.admin;
        group['owner'] = UID;
        onTransferOwnership && onTransferOwnership(group, member);
        
        //message parameter removed
        CometChatUIEventHandler.emitGroupEvent(CometChatUIEvents.ccOwnershipChanged, {
          group,
          newOwner: member,
        });
        onBack && onBack();
      },
      (error) => {
        onError && onError(error);
        console.log('Could not transfer ownership of the group: ', error);
      }
    );
  };

  useEffect(() => {
    CometChat.getLoggedinUser().then(
      (loggedUser: CometChat.User) => {
        setLoggedInUser(loggedUser);
      },
      (error: CometChat.CometChatException) => {
        onError && onError(error);
      }
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <CometChatGroupsMembers
        title={title}
        group={group}
        TailView={(item: any) => {
          return (
            <View>
              <Text>
                {loggedInUser.getUid() === item.owner
                  ? GroupMemberScope.owner
                  : item.scope}
              </Text>
            </View>
          );
        }}
        selectionMode={'single'}
        onSelection={transferOwnership}
        onBack={onBack}
        {...newProps}
      />
    </View>
  );
};

CometChatTransferOwnership.defaultProps = {
  group: {},
  title: localize("Transfer Ownership"), // Note: Update after localization is updated
};
