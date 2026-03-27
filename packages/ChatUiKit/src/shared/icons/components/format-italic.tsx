import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgComponent = ({ height, width, color }: SvgProps) => (
  <Svg width={width} height={height} fill='none' viewBox='0 -960 960 960'>
    <Path
      fill={color}
      d='M215.77-215v-72.31h152.69l129.62-385.38H345.39V-745h366.15v72.31H571.15L441.54-287.31h140.38V-215H215.77Z'
    />
  </Svg>
);
export default SvgComponent;
