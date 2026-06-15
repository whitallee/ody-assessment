import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, letterSpacing } from '@ody/shared';

type Variant =
  | 'display'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'body'
  | 'bodyMedium'
  | 'bodySemiBold'
  | 'bodyBold'
  | 'caption'
  | 'label'
  | 'overline';

type ColorKey = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'brand' | 'error';

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: ColorKey;
}

const colorMap: Record<ColorKey, string> = {
  primary: colors.neutral[900],
  secondary: colors.neutral[500],
  tertiary: colors.neutral[400],
  inverse: colors.neutral[0],
  brand: colors.brand[700],
  error: colors.error[600],
};

const styles = StyleSheet.create({
  display: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * 1.15,
    letterSpacing: letterSpacing.tight,
    color: colors.neutral[900],
  },
  heading1: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * 1.2,
    letterSpacing: letterSpacing.tight,
    color: colors.neutral[900],
  },
  heading2: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * 1.25,
    color: colors.neutral[900],
  },
  heading3: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.3,
    color: colors.neutral[900],
  },
  heading4: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.35,
    color: colors.neutral[900],
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    color: colors.neutral[700],
  },
  bodyMedium: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    color: colors.neutral[700],
  },
  bodySemiBold: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    color: colors.neutral[900],
  },
  bodyBold: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    color: colors.neutral[900],
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    color: colors.neutral[500],
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    color: colors.neutral[700],
  },
  overline: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
    letterSpacing: letterSpacing.widest,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
});

export function Typography({ variant = 'body', color, style, ...props }: TypographyProps) {
  return (
    <Text
      style={[styles[variant], color ? { color: colorMap[color] } : undefined, style]}
      {...props}
    />
  );
}
