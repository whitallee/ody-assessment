import { Pressable, View, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import { colors, radius, spacing, fontFamily, fontSize } from '@ody/shared';
import { Typography } from './Typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantConfig = {
  primary: {
    bg: colors.brand[700],
    bgHover: colors.brand[800],
    bgPressed: colors.brand[900],
    text: colors.neutral[0],
    border: 'transparent',
  },
  secondary: {
    bg: colors.neutral[100],
    bgHover: colors.neutral[200],
    bgPressed: colors.neutral[300],
    text: colors.neutral[800],
    border: colors.neutral[200],
  },
  ghost: {
    bg: 'transparent',
    bgHover: colors.neutral[100],
    bgPressed: colors.neutral[200],
    text: colors.neutral[700],
    border: 'transparent',
  },
  danger: {
    bg: colors.error[600],
    bgHover: colors.error[700],
    bgPressed: colors.error[700],
    text: colors.neutral[0],
    border: 'transparent',
  },
  outline: {
    bg: 'transparent',
    bgHover: colors.brand[50],
    bgPressed: colors.brand[100],
    text: colors.brand[700],
    border: colors.brand[600],
  },
};

const sizeConfig = {
  sm: { height: 32, px: spacing[3], fontSize: fontSize.sm, iconSize: 14 },
  md: { height: 40, px: spacing[4], fontSize: fontSize.base, iconSize: 16 },
  lg: { height: 48, px: spacing[5], fontSize: fontSize.md, iconSize: 18 },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const config = variantConfig[variant];
  const sz = sizeConfig[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.base,
        {
          height: sz.height,
          paddingHorizontal: sz.px,
          backgroundColor: pressed
            ? config.bgPressed
            : hovered
              ? config.bgHover
              : config.bg,
          borderColor: config.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        isDisabled && styles.disabled,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={config.text} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Typography
            style={{
              fontFamily: fontFamily.bodySemiBold,
              fontSize: sz.fontSize,
              color: isDisabled ? colors.neutral[400] : config.text,
              lineHeight: sz.fontSize * 1.4,
            }}
          >
            {label}
          </Typography>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    cursor: 'pointer',
  } as object,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: { marginRight: spacing[2] },
  iconRight: { marginLeft: spacing[2] },
  disabled: { opacity: 0.5, cursor: 'not-allowed' } as object,
});
