import { anyObject } from "../utils";

export const getFilteredStyles = <T>(style: T|any, arrayOfKeys: string[]): T => {
  let overrideStyle: any = {};
  arrayOfKeys.forEach((element: any) => {
    if (style && style[element]) overrideStyle[element] = style[element];
  });
  return overrideStyle as T;
};

export const getFilteredStylesWithKeySwap = <T>(
  style: any,
  objectOfKeys: anyObject
): T => {
  let overrideStyle: any = {};
  for (const key in objectOfKeys) {
    if (style[key]) overrideStyle[objectOfKeys[key]] = style[key];
  }
  return overrideStyle as T;
};
