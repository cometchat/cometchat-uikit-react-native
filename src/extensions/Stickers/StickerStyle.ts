import { BaseStyle, BaseStyleInterface } from "../../shared/base";

export interface StickerStyleInterface extends BaseStyle {}

export class StickerStyle extends BaseStyle {
    constructor({
        height = 100,
        width = 100,
    }: BaseStyleInterface) {
        super({
            height,
            width
        });
    }
}