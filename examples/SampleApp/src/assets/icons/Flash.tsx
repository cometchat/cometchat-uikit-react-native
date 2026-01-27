import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";

const SvgComponent = ({ width = 24, height = 24, color }: SvgProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
  >
    <Path
      d="M18 2H6V8L8 11V22H16V11L18 8V2ZM16 4V5H8V4H16ZM14 10.4V20H10V10.39L8 7.39V7H16V7.39L14 10.4Z"
      fill={color || "#F9F8FD"}
    />
    <Path
      d="M12 15.5C12.8284 15.5 13.5 14.8284 13.5 14C13.5 13.1716 12.8284 12.5 12 12.5C11.1716 12.5 10.5 13.1716 10.5 14C10.5 14.8284 11.1716 15.5 12 15.5Z"
      fill={color || "#F9F8FD"}
    />
  </Svg>
);

export default SvgComponent;
