import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: filter */
import type { SvgProps } from "react-native-svg";
const SvgComponent = ({ height, width, color }: SvgProps) => (
  <Svg width={width} height={height} fill='none' viewBox='0 0 22 27'>
    <Path fill='#8289AD' d='M15.1328 0.000610352L21.7988 6.66663V24.5338C21.7988 25.712 20.8442 26.6675 19.666 26.6676H2.33301C1.1548 26.6676 0.199219 25.712 0.199219 24.5338V2.1344C0.199219 0.956192 1.1548 0.000610352 2.33301 0.000610352H15.1328Z' />
    <Path fill='#fff' d='M11.5666 20.0011V10.9954H15.0846V10.0011H6.91797V10.9954H10.436V20.0011H11.5666Z' />
    <Path fill='url(#prefix__text-file-type_b)' d='M21.176 6.04163L15.7598 6.04163L21.8014 12.0833L21.8014 6.66663L21.176 6.04163Z' />
    <Path fill='#CDCFDE' d='M17.2674 6.66663L21.8008 6.66663L15.1341 -4.06371e-05L15.1341 4.53329C15.1341 5.7115 16.0892 6.66663 17.2674 6.66663Z' />
    <Defs>
      <LinearGradient
        id='prefix__text-file-type_b'
        x1={15.7598}
        x2={23.1556}
        y1={5.94193}
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
