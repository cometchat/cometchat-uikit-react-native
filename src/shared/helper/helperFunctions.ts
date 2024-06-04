export const getFilteredStyles = <T>(style: T, arrayOfKeys: string[]): T => {
  let overrideStyle = {};
  arrayOfKeys.forEach((element) => {
    if (style && style[element]) overrideStyle[element] = style[element];
  });
  return overrideStyle as T;
};

export const getFilteredStylesWithKeySwap = <T>(
  style: any,
  objectOfKeys: object
): T => {
  let overrideStyle = {};
  for (const key in objectOfKeys) {
    if (style[key]) overrideStyle[objectOfKeys[key]] = style[key];
  }
  return overrideStyle as T;
};
