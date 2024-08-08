import React from "react";

export const Hooks = (
  props: any,
  setActionList: any
) => {
  React.useEffect(() => {
    setActionList(props.actions);
  },[props.actions])
};
