import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@ody/shared';
import { Typography } from './Typography';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
type BadgeSize = 'sm' | 'md';

// Order status → badge variant
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: 'warning',
  accepted: 'info',
  preparing: 'brand',
  ready: 'success',
  completed: 'default',
  cancelled: 'error',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const variantStyles = {
  default: { bg: colors.neutral[100], text: colors.neutral[600] },
  success: { bg: colors.success[50], text: colors.success[700] },
  warning: { bg: colors.warning[50], text: colors.warning[700] },
  error: { bg: colors.error[50], text: colors.error[700] },
  info: { bg: colors.info[50], text: colors.info[700] },
  brand: { bg: colors.brand[100], text: colors.brand[800] },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({ label, variant = 'default', size = 'md', dot = false }: BadgeProps) {
  const { bg, text } = variantStyles[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingHorizontal: isSmall ? spacing[1.5] : spacing[2.5],
          paddingVertical: isSmall ? 2 : spacing[1],
        },
      ]}
    >
      {dot && (
        <View
          style={[styles.dot, { backgroundColor: text }]}
        />
      )}
      <Typography
        variant={isSmall ? 'caption' : 'label'}
        style={{ color: text, fontFamily: 'Inter_600SemiBold' }}
      >
        {label}
      </Typography>
    </View>
  );
}

export function OrderStatusBadge({
  status,
  size = 'md',
}: {
  status: OrderStatus;
  size?: BadgeSize;
}) {
  return (
    <Badge
      label={STATUS_LABEL[status]}
      variant={STATUS_VARIANT[status]}
      size={size}
      dot
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
