import React from 'react';

import { ThemeContext, LocaleContext } from '../Contexts';
import { DefaultTheme } from '../Themes';
import { DefaultLocale } from '../Locales';
import type { Theme, Locale } from '../Entities';

import BaseCalendar, { Props as BaseCalendarProps } from './BaseCalendar';

interface ProviderProps {
  locale?: Locale;
  theme?: Theme;
}

type Props = ProviderProps & BaseCalendarProps;

const Providers: React.FC<Props> = ({ theme, locale, ...otherProps }) => {
  return (
    <LocaleContext.Provider value={locale ?? DefaultLocale}>
      <ThemeContext.Provider value={theme ?? DefaultTheme}>
        <BaseCalendar {...otherProps} />
      </ThemeContext.Provider>
    </LocaleContext.Provider>
  );
};

export default React.memo(Providers);
