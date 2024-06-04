import React from 'react';
import type { Locale } from '../Entities';
import { DefaultLocale } from '../Locales';

const LocaleContext = React.createContext<Locale>(DefaultLocale);

export default LocaleContext;
