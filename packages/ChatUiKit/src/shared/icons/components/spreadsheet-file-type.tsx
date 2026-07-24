import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: filter */
import type { SvgProps } from "react-native-svg";
const SvgComponent = ({ height, width, color }: SvgProps) => (
  <Svg width={width} height={height} fill='none' viewBox='0 0 22 27'>
    <Path fill='#32BD7A' d='M15.1328 0.000610352L21.7988 6.66663V24.5338C21.7988 25.712 20.8442 26.6675 19.666 26.6676H2.33301C1.1548 26.6676 0.199219 25.712 0.199219 24.5338V2.1344C0.199219 0.956192 1.1548 0.000610352 2.33301 0.000610352H15.1328Z' />
    <Path fill='#fff' d='M8.00732 20.0011L10.9932 15.7154L13.9945 20.0011H15.4173L11.6835 14.8051L15.1485 10.0011H13.7257L10.9932 13.8946L8.27398 10.0011H6.85165L10.2888 14.8051L6.58398 20.0011H8.00732Z' />
    <Path fill='url(#prefix__spreadsheet-file-type_b)' d='M21.174 6.04163L15.7578 6.04163L21.7995 12.0833L21.7995 6.66663L21.174 6.04163Z' />
    <Path fill='#EBFFEC' d='M17.2674 6.66663L21.8008 6.66663L15.1341 -4.06371e-05L15.1341 4.53329C15.1341 5.7115 16.0892 6.66663 17.2674 6.66663Z' />
    <Defs>
      <LinearGradient
        id='prefix__spreadsheet-file-type_b'
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
