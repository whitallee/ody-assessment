import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, formatCurrency, formatRelativeTime } from '@ody/shared';
import { PageLayout, Section, Grid } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { api, type HomeStats, type OrderWithDetails } from '@/lib/api';

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'stats'],
    queryFn: api.home.stats,
    refetchInterval: 30_000,
  });

  return (
    <PageLayout
      title="Dashboard"
      subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    >
      {/* KPI cards */}
      <Section title="Today's Overview">
        <View style={styles.kpiGrid}>
          <KpiCard
            label="Orders Today"
            value={isLoading ? undefined : String(data?.totalOrdersToday ?? 0)}
            sub={isLoading ? undefined : `${data?.pendingOrders ?? 0} pending`}
            accent={colors.brand[500]}
            loading={isLoading}
          />
          <KpiCard
            label="Revenue Today"
            value={isLoading ? undefined : formatCurrency(data?.revenueToday ?? 0)}
            sub={isLoading ? undefined : `${formatCurrency(data?.revenueAllTime ?? 0)} all time`}
            accent={colors.success[500]}
            loading={isLoading}
          />
          <KpiCard
            label="Pending Orders"
            value={isLoading ? undefined : String(data?.pendingOrders ?? 0)}
            sub="Need attention"
            accent={data?.pendingOrders ? colors.warning[500] : colors.neutral[300]}
            loading={isLoading}
          />
          <KpiCard
            label="Total Orders"
            value={isLoading ? undefined : String(data?.totalOrdersAllTime ?? 0)}
            sub="All time"
            accent={colors.info[500]}
            loading={isLoading}
          />
        </View>
      </Section>

      <View style={styles.row}>
        {/* Recent Orders */}
        <Card style={styles.recentCard} padding="none">
          <View style={styles.cardHeader}>
            <Typography variant="heading4">Recent Orders</Typography>
          </View>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={styles.orderRowSkeleton}>
                  <Skeleton width="30%" height={12} />
                  <Skeleton width="20%" height={12} />
                </View>
              ))
            : data?.recentOrders?.map((order) => (
                <RecentOrderRow key={order.id} order={order} />
              ))}
        </Card>

        {/* Popular Items */}
        <Card style={styles.popularCard} padding="none">
          <View style={styles.cardHeader}>
            <Typography variant="heading4">Popular Items</Typography>
          </View>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={styles.orderRowSkeleton}>
                  <Skeleton width="40%" height={12} />
                  <Skeleton width="15%" height={12} />
                </View>
              ))
            : data?.popularItems?.map((item, i) => (
                <View key={item.menuItemId} style={styles.popularRow}>
                  <View style={styles.popularRank}>
                    <Typography
                      variant="bodySemiBold"
                      style={{ color: i === 0 ? colors.brand[600] : colors.neutral[400] }}
                    >
                      #{i + 1}
                    </Typography>
                  </View>
                  <Typography variant="bodyMedium" style={styles.popularName}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption">
                    {item.orderCount} orders
                  </Typography>
                  <Typography variant="bodySemiBold" color="brand">
                    {formatCurrency(item.revenueCents)}
                  </Typography>
                </View>
              ))}
        </Card>
      </View>

      {/* Orders by status */}
      {data?.ordersByStatus && (
        <Section title="Orders by Status">
          <View style={styles.statusGrid}>
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <Card key={status} style={styles.statusCard} padding="sm">
                <OrderStatusBadge status={status as never} />
                <Typography variant="heading3" style={{ marginTop: spacing[2] }}>
                  {count}
                </Typography>
              </Card>
            ))}
          </View>
        </Section>
      )}
    </PageLayout>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string;
  value?: string;
  sub?: string;
  accent: string;
  loading: boolean;
}) {
  return (
    <Card style={styles.kpiCard} variant="elevated">
      <View style={[styles.kpiAccent, { backgroundColor: accent }]} />
      <Typography variant="overline">{label}</Typography>
      {loading ? (
        <>
          <View style={{ height: spacing[2] }} />
          <Skeleton height={32} width="70%" />
          <View style={{ height: spacing[1.5] }} />
          <Skeleton height={12} width="50%" />
        </>
      ) : (
        <>
          <Typography variant="heading1" style={styles.kpiValue}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="secondary">
              {sub}
            </Typography>
          )}
        </>
      )}
    </Card>
  );
}

function RecentOrderRow({ order }: { order: OrderWithDetails }) {
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderRowLeft}>
        <Typography variant="bodyMedium">
          {order.customer?.name ?? 'Guest'}
        </Typography>
        <Typography variant="caption" color="secondary">
          {formatRelativeTime(order.createdAt)}
        </Typography>
      </View>
      <View style={styles.orderRowRight}>
        <OrderStatusBadge status={order.status} size="sm" />
        <Typography variant="bodySemiBold" color="brand">
          {formatCurrency(order.totalCents)}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  kpiAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  kpiValue: {
    marginTop: spacing[1],
    marginBottom: spacing[0.5],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[4],
    flexWrap: 'wrap',
  },
  recentCard: {
    flex: 2,
    minWidth: 300,
  },
  popularCard: {
    flex: 1,
    minWidth: 250,
  },
  cardHeader: {
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  orderRowLeft: { gap: spacing[0.5] },
  orderRowRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  orderRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[3],
  },
  popularRank: { width: 28 },
  popularName: { flex: 1 },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  statusCard: {
    minWidth: 100,
  },
});
