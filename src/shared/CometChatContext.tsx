import React, { createContext, useState } from 'react';
import { CometChatContextType } from './base/Types';
import { CometChatTheme } from './resources/CometChatTheme';
import { CometChatLocalize } from './resources/CometChatLocalize';

const themeObj = new CometChatTheme({});
export const CometChatContext = createContext<CometChatContextType>({
  theme: themeObj,
  changeLocalise(language) {
      CometChatLocalize.setLocale(language);
  },
  applyTheme(theme) {}
});

export const CometChatContextProvider = (props) => {
  const { children } = props;

  const [theme, setTheme] = useState(props.theme);

  const changeThemeMode = (mode: "light" | "dark") => {
    let newTheme = new CometChatTheme({palette: props.theme.palette, typography: props.theme.typography});
    newTheme.palette.setMode(mode);
    setTheme(newTheme);
  }

  const changeLocalise = (language: string) => {
    CometChatLocalize.setLocale(language);
  }

  const applyTheme = (theme: CometChatTheme) => {
    setTheme(theme);
  }

  return (
    <CometChatContext.Provider value={{theme, changeThemeMode, changeLocalise, applyTheme}}>
      {children}
    </CometChatContext.Provider>
  );
};