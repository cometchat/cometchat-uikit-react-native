import type { Props as ArrowProps } from '../Components/Arrow';
import type { Props as TitleProps } from '../Components/Title';
import type { Props as MonthProps } from '../Components/Month';
import type { Props as DayProps } from '../Components/Day';
import type { Props as WeekdaysProps } from '../Components/Weekdays';

export type ArrowComponentType = (props: ArrowProps) => JSX.Element | null;
export type TitleComponentType = (props: TitleProps) => JSX.Element | null;
export type MonthComponentType = (props: MonthProps) => JSX.Element | null;
export type DayComponentType = (props: DayProps) => JSX.Element | null;
export type WeekdaysComponentType = (props: WeekdaysProps) => JSX.Element | null;

export type { ArrowProps, TitleProps, MonthProps, DayProps, WeekdaysProps };
