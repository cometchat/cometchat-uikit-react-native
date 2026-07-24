import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: filter */
import type { SvgProps } from "react-native-svg";
const SvgComponent = ({ height, width, color }: SvgProps) => (
  <Svg width={width} height={height} fill='none' viewBox='0 0 22 27'>
    <Path fill='#FF9333' d='M15.1328 0.000610352L21.7988 6.66663V24.5338C21.7988 25.712 20.8442 26.6675 19.666 26.6676H2.33301C1.1548 26.6676 0.199219 25.712 0.199219 24.5338V2.1344C0.199219 0.956192 1.1548 0.000610352 2.33301 0.000610352H15.1328Z' />
    <Path fill='#fff' d='M9.192 20.0011V15.9114H12.1055C14.3918 15.9114 15.5488 14.9171 15.5488 12.9423C15.5488 10.9814 14.4057 10.0011 12.1195 10.0011H8.04883V20.0011H9.192ZM12.0498 14.9171H9.192V10.9954H12.0498C12.8443 10.9954 13.4298 11.1496 13.8202 11.4858C14.2105 11.7798 14.4057 12.2699 14.4057 12.9424C14.4057 13.6146 14.2107 14.1048 13.834 14.4269C13.4438 14.7489 12.8583 14.9169 12.0498 14.9169V14.9171Z' />
    <Path fill='url(#prefix__presentation-file-type_b)' d='M21.174 6.04163L15.7578 6.04163L21.7995 12.0833L21.7995 6.66663L21.174 6.04163Z' />
    <Path fill='#FFD3AD' d='M17.2655 6.66663L21.7988 6.66663L15.1322 -4.06371e-05L15.1322 4.53329C15.1322 5.7115 16.0873 6.66663 17.2655 6.66663Z' />
    <Defs>
      <LinearGradient
        id='prefix__presentation-file-type_b'
        x1={17.112}
        x2={23.1536}
        y1={4.68746}
        y2={10.7291}
        gradientUnits='userSpaceOnUse'
      >
        <Stop stopOpacity={0.2} />
        <Stop offset={1} stopOpacity={0} />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default SvgComponent;
