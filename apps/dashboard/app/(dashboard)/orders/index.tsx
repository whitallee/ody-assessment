import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, formatCurrency, formatDateTime } from '@ody/shared';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Badge, OrderStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { CreateOrderModal } from '@/components/features/orders/CreateOrderModal';
import { api, type OrderWithDetails, type OrderStatus } from '@/lib/api';

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
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () =>
      api.orders.list({
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        limit: 100,
      }),
    refetchInterval: 20_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.orders.updateStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['home', 'stats'] });
      setSelectedOrder(updated);
      toast(`Order ${updated.status}`, 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const orders = data?.data ?? [];

  return (
    <PageLayout
      title="Orders"
      subtitle={`${data?.total ?? 0} total orders`}
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

      {/* Orders table */}
      <Card padding="none">
        {/* Table header */}
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
                  <OrderStatusBadge status={order.status} size="sm" />
                </View>
                <Typography variant="caption" color="secondary" style={styles.td}>
                  {formatDateTime(order.createdAt)}
                </Typography>
                <View style={styles.tdAction}>
                  {NEXT_LABEL[order.status] && (
                    <Button
                      label={NEXT_LABEL[order.status]!}
                      size="sm"
                      variant="secondary"
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        const next = NEXT_STATUS[order.status];
                        if (next) updateStatus.mutate({ id: order.id, status: next });
                      }}
                    />
                  )}
                </View>
              </Pressable>
            ))}

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
            updateStatus.mutate({ id: selectedOrder.id, status });
          }}
          loading={updateStatus.isPending}
        />
      )}

      {/* Create order modal */}
      <CreateOrderModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(order) => {
          qc.invalidateQueries({ queryKey: ['orders'] });
          qc.invalidateQueries({ queryKey: ['home', 'stats'] });
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
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_LABEL[order.status];

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
        <OrderStatusBadge status={order.status} />
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
});
