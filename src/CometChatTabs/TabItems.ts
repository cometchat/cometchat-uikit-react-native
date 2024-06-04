import { BaseStyleInterface, FontStyleInterface, ImageType } from "../shared"
import { TabItemStyleInterface } from "./TabItemStyle"

export type TabItem = {
    id: string | number,
    title?: string,
    icon?: ImageType,
    isActive?: boolean,
    childView: () => JSX.Element,
    style?: TabItemStyleInterface
}
