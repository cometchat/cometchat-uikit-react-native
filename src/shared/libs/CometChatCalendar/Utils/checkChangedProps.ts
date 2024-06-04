export default (prevProps: Record<string, any>, nextProps: Record<string, any>) => {
  Object.keys(nextProps)
    .filter((key) => {
      return nextProps[key] !== prevProps[key];
    })
    .map((key) => {
      console.log('changed property:', key, 'from', prevProps[key], 'to', nextProps[key]);
    });
  return false;
};
