import React from 'react';
import type { Theme } from '../Entities';
import { DefaultTheme } from '../Themes';

const ThemeContext = React.createContext<Theme>(DefaultTheme);

export default ThemeContext;
