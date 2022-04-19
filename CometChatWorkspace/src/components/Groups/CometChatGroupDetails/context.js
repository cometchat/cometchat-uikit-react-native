import React from 'react';

const GroupDetailContext = React.createContext({
  memberList: [],
  bannedMemberList: [],
  administratorsList: [],
  moderatorsList: [],
});

export default GroupDetailContext;
