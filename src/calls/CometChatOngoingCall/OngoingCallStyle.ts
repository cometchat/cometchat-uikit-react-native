export interface OngoingCallStyleInterface {
    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,
}

export class OngoingCallStyle implements OngoingCallStyleInterface {
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number

    constructor({
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
    }: OngoingCallStyleInterface) {
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
    }
}