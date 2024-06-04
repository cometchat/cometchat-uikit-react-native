import { CometChat } from '@cometchat-pro/react-native-chat';
import React, { createContext, useState } from 'react';

export const UserContext = createContext<{
    user?: CometChat.User,
    group?: CometChat.Group,
    call?: CometChat.Message,
    protectedGroup?: CometChat.Group,
    setUser?: (user: CometChat.User)=>void,
    setGroup?: (group: CometChat.Group)=>void,
    setCall?: (call: CometChat.Message)=>void,
    setProtectedGroup?: (group: CometChat.Group)=>void,
}>({});

export const UserContextProvider = (props) => {

  const {children} = props;

  const [user, assignUser] = useState<CometChat.User>();
  const [group, assignGroup] = useState<CometChat.Group>();
  const [call, assignCall] = useState<CometChat.Message>();
  const [protectedGroup, assignProtectedGroup] = useState<CometChat.Group>();

  const setUser = (user: CometChat.User) => {
    assignUser(user);
  }

  const setGroup = (group: CometChat.Group) => {
    assignGroup(group);
  }

  const setProtectedGroup = (group: CometChat.Group) => {
    assignProtectedGroup(group);
  }

  const setCall = (call: CometChat.Message) => {
    assignCall(call);
  }

  return (
    <UserContext.Provider value={{user, group, call, protectedGroup, setUser, setGroup, setCall, setProtectedGroup}}>
      {children}
    </UserContext.Provider>
  );
};
