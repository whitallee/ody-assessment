import { View, ViewProps, StyleSheet, Pressable, PressableProps } from 'react-native';
import { colors, radius, shadow, spacing } from '@ody/shared';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardPressableProps extends PressableProps {
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: 0,
  sm: spacing[3],
  md: spacing[5],
  lg: spacing[6],
};

const baseCard = {
  backgroundColor: colors.neutral[0],
  borderRadius: radius.xl,
  borderWidth: 1,
  borderColor: colors.neutral[200],
};

const styles = StyleSheet.create({
  default: { ...baseCard, ...shadow.sm },
  elevated: { ...baseCard, ...shadow.md },
  flat: { ...baseCard, ...shadow.none },
});

export function Card({ variant = 'default', padding = 'md', style, children, ...props }: CardProps) {
  return (
    <View
      style={[styles[variant], { padding: paddingMap[padding] }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardPressable({
  variant = 'default',
  padding = 'md',
  style,
  children,
  ...props
}: CardPressableProps) {
  return (
    <Pressable
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles[variant],
        { padding: paddingMap[padding] },
        hovered && { borderColor: colors.brand[300], ...shadow.md },
        pressed && { opacity: 0.95 },
        style as object,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
