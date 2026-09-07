
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const GUIDELINE_BASE_WIDTH = 375;

export function scale(size) {
  return (width / GUIDELINE_BASE_WIDTH) * size;
}
export function moderateScale(size, factor = 0.5) {
  return size + (scale(size) - size) * factor;
}
export const screenWidth = width;
export const screenHeight = height;
export const isSmallDevice = width < 360;
export const isTablet = width >= 768;

export const maxContentWidth = 700;
