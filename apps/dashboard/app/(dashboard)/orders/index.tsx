import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, formatCurrency, formatDateTime } from '@ody/shared';
import {
  useGetOrders,
  usePatchOrdersIdStatus,
  getGetOrdersQueryKey,
  getGetHomeStatsQueryKey,
  type PatchOrdersIdStatus200,
  type GetOrdersParams,
  type getOrdersResponse,
} from '@ody/api-client';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Badge, OrderStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { CreateOrderModal } from '@/components/features/orders/CreateOrderModal';
import type { OrderWithDetails, OrderStatus } from '@/lib/types';

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'completed',
  completed: null,
  cancelled: null,
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Accept',
  accepted: 'Start Prep',
  preparing: 'Mark Ready',
  ready: 'Complete',
};

export default function OrdersPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const queryParams: GetOrdersParams = {
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    limit: 100,
  };

  const { data: ordersResponse, isLoading } = useGetOrders(
    queryParams,
    { query: { refetchInterval: 20_000 } },
  );
  const orders = (ordersResponse?.data.data ?? []) as OrderWithDetails[];

  const updateStatus = usePatchOrdersIdStatus({
    mutation: {
      onMutate: async ({ id, data: { status } }) => {
        await qc.cancelQueries({ queryKey: getGetOrdersQueryKey() });
        const queryKey = getGetOrdersQueryKey(queryParams);
        const previousData = qc.getQueryData<getOrdersResponse>(queryKey);
        qc.setQueryData<getOrdersResponse>(queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              data: old.data.data.map((order) =>
                order.id === id ? { ...order, status } : order,
              ),
            },
          };
        });
        return { previousData, queryKey };
      },
      onError: (err: Error, _vars, context) => {
        const ctx = context as
          | { previousData: getOrdersResponse | undefined; queryKey: ReturnType<typeof getGetOrdersQueryKey> }
          | undefined;
        if (ctx?.previousData !== undefined) {
          qc.setQueryData(ctx.queryKey, ctx.previousData);
        }
        toast(err.message, 'error');
      },
      onSuccess: (result) => {
        const updated = result.data as PatchOrdersIdStatus200;
        setSelectedOrder(updated as unknown as OrderWithDetails);
        toast(`Order ${updated.status}`, 'success');
      },
      onSettled: () => {
        qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        qc.invalidateQueries({ queryKey: getGetHomeStatsQueryKey() });
      },
    },
  });

  return (
    <PageLayout
      title="Orders"
      subtitle={`${ordersResponse?.data.total ?? 0} total orders`}
      actions={<Button label="New Order" onPress={() => setShowCreate(true)} />}
    >
      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          <FilterTab
            label="All"
            active={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
          />
          {ALL_STATUSES.map((s) => (
            <FilterTab
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={statusFilter === s}
              onPress={() => setStatusFilter(s)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Orders table / card list */}
      <Card padding="none">
        {isMobile ? (
          /* ── Mobile: card-based list ── */
          <>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <Skeleton width="40%" height={14} />
                      <Skeleton width={64} height={22} borderRadius={99} />
                    </View>
                    <View style={styles.orderCardMeta}>
                      <Skeleton width="20%" height={12} />
                      <Skeleton width="20%" height={12} />
                      <Skeleton width="30%" height={12} />
                    </View>
                  </View>
                ))
              : orders.map((order) => (
                  <Pressable
                    key={order.id}
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.orderCard,
                      hovered && styles.tableRowHover,
                    ]}
                    onPress={() => setSelectedOrder(order)}
                  >
                    <View style={styles.orderCardHeader}>
                      <Typography variant="bodyMedium" style={{ flex: 1 }}>
                        {order.customer?.name ?? 'Guest'}
                      </Typography>
                      <OrderStatusBadge status={order.status as never} size="sm" />
                    </View>
                    <View style={styles.orderCardMeta}>
                      <Typography variant="caption" color="secondary">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </Typography>
                      <Typography variant="caption" color="secondary"> · </Typography>
                      <Typography variant="caption" color="secondary">
                        {formatCurrency(order.totalCents)}
                      </Typography>
                      <Typography variant="caption" color="secondary"> · </Typography>
                      <Typography variant="caption" color="secondary">
                        {formatDateTime(order.createdAt)}
                      </Typography>
                    </View>
                    {NEXT_LABEL[order.status as OrderStatus] && (
                      <View style={styles.orderCardAction}>
                        <Button
                          label={NEXT_LABEL[order.status as OrderStatus]!}
                          size="sm"
                          variant="secondary"
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            const next = NEXT_STATUS[order.status as OrderStatus];
                            if (next)
                              updateStatus.mutate({ id: order.id, data: { status: next } });
                          }}
                        />
                      </View>
                    )}
                  </Pressable>
                ))}
          </>
        ) : (
          /* ── Desktop: table layout ── */
          <>
            <View style={styles.tableHeader}>
              {['Customer', 'Items', 'Total', 'Status', 'Time', ''].map((h) => (
                <Typography key={h} variant="overline" style={styles.th}>
                  {h}
                </Typography>
              ))}
            </View>

            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Skeleton width="25%" height={13} />
                    <Skeleton width="15%" height={13} />
                    <Skeleton width="15%" height={13} />
                    <Skeleton width="18%" height={20} />
                    <Skeleton width="18%" height={13} />
                    <Skeleton width="8%" height={28} borderRadius={6} />
                  </View>
                ))
              : orders.map((order) => (
                  <Pressable
                    key={order.id}
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.tableRow,
                      hovered && styles.tableRowHover,
                    ]}
                    onPress={() => setSelectedOrder(order)}
                  >
                    <Typography variant="bodyMedium" style={styles.td}>
                      {order.customer?.name ?? 'Guest'}
                    </Typography>
                    <Typography variant="body" color="secondary" style={styles.td}>
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </Typography>
                    <Typography variant="bodySemiBold" style={styles.td}>
                      {formatCurrency(order.totalCents)}
                    </Typography>
                    <View style={styles.td}>
                      <OrderStatusBadge status={order.status as never} size="sm" />
                    </View>
                    <Typography variant="caption" color="secondary" style={styles.td}>
                      {formatDateTime(order.createdAt)}
                    </Typography>
                    <View style={styles.tdAction}>
                      {NEXT_LABEL[order.status as OrderStatus] && (
                        <Button
                          label={NEXT_LABEL[order.status as OrderStatus]!}
                          size="sm"
                          variant="secondary"
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            const next = NEXT_STATUS[order.status as OrderStatus];
                            if (next)
                              updateStatus.mutate({ id: order.id, data: { status: next } });
                          }}
                        />
                      )}
                    </View>
                  </Pressable>
                ))}
          </>
        )}

        {!isLoading && orders.length === 0 && (
          <View style={styles.empty}>
            <Typography variant="heading4" color="secondary">
              No orders
            </Typography>
            <Typography variant="body" color="tertiary">
              {statusFilter !== 'all'
                ? `No ${statusFilter} orders right now.`
                : 'Create a new order to get started.'}
            </Typography>
          </View>
        )}
      </Card>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) => {
            updateStatus.mutate({ id: selectedOrder.id, data: { status } });
          }}
          loading={updateStatus.isPending}
        />
      )}

      {/* Create order modal */}
      <CreateOrderModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(order) => {
          qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          qc.invalidateQueries({ queryKey: getGetHomeStatsQueryKey() });
          setShowCreate(false);
          setSelectedOrder(order);
          toast('Order created', 'success');
        }}
      />
    </PageLayout>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  loading,
}: {
  order: OrderWithDetails;
  onClose: () => void;
  onStatusChange: (s: OrderStatus) => void;
  loading: boolean;
}) {
  const nextStatus = NEXT_STATUS[order.status as OrderStatus];
  const nextLabel = NEXT_LABEL[order.status as OrderStatus];

  return (
    <Modal
      visible
      onClose={onClose}
      title={`Order — ${order.customer?.name ?? 'Guest'}`}
      footer={
        nextStatus && nextLabel ? (
          <View style={styles.modalFooter}>
            <Button label="Close" variant="ghost" onPress={onClose} />
            <Button
              label={nextLabel}
              onPress={() => onStatusChange(nextStatus)}
              loading={loading}
            />
          </View>
        ) : (
          <View style={styles.modalFooter}>
            <Button label="Close" variant="ghost" onPress={onClose} />
          </View>
        )
      }
    >
      <View style={styles.detailHeader}>
        <OrderStatusBadge status={order.status as never} />
        <Typography variant="caption" color="secondary">
          {formatDateTime(order.createdAt)}
        </Typography>
      </View>

      {order.notes && (
        <View style={styles.notesBox}>
          <Typography variant="label" color="secondary">Note</Typography>
          <Typography variant="body">{order.notes}</Typography>
        </View>
      )}

      <View style={styles.itemsList}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Typography variant="body" style={{ flex: 1 }}>
              {item.quantity}× {item.menuItem.name}
            </Typography>
            <Typography variant="bodySemiBold">
              {formatCurrency(item.subtotalCents)}
            </Typography>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Typography variant="bodySemiBold">Total</Typography>
          <Typography variant="heading4" color="brand">
            {formatCurrency(order.totalCents)}
          </Typography>
        </View>
      </View>

      {order.customer && (
        <View style={styles.customerBox}>
          <Typography variant="label" color="secondary">Customer</Typography>
          <Typography variant="bodyMedium">{order.customer.name}</Typography>
          {order.customer.email && (
            <Typography variant="caption" color="secondary">{order.customer.email}</Typography>
          )}
        </View>
      )}
    </Modal>
  );
}

function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterTab, active && styles.filterTabActive]}
    >
      <Typography
        variant="label"
        style={[
          styles.filterTabLabel,
          active && styles.filterTabLabelActive,
        ]}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  filterTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 99,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: colors.neutral[900],
    borderColor: colors.neutral[900],
  },
  filterTabLabel: {
    color: colors.neutral[600],
    fontFamily: 'Inter_500Medium',
  },
  filterTabLabelActive: {
    color: colors.neutral[0],
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[50],
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  tableRowHover: {
    backgroundColor: colors.neutral[50],
  },
  th: {
    flex: 1,
  },
  td: {
    flex: 1,
  },
  tdAction: {
    width: 90,
    alignItems: 'flex-end',
  },
  empty: {
    padding: spacing[10],
    alignItems: 'center',
    gap: spacing[2],
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[3],
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  notesBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[1],
  },
  itemsList: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[1.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
  },
  customerBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: spacing[3],
    gap: spacing[0.5],
  },
  orderCard: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[2],
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  orderCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  orderCardAction: {
    alignSelf: 'flex-start',
  },
});
