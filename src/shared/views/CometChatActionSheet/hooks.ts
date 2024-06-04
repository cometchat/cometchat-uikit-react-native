import React from "react";

export const Hooks = (
  props,
  setActionList
) => {
  React.useEffect(() => {
    setActionList(props.actions);
  },[props.actions])
};
