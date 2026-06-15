import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, formatCurrency, formatDate } from '@ody/shared';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { api, type CustomerWithStats } from '@/lib/api';
import { initials } from '@ody/shared';

export default function CrmPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list({ limit: 100 }),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const customers = data?.data ?? [];

  return (
    <PageLayout
      title="CRM"
      subtitle={`${data?.total ?? 0} customers`}
      actions={<Button label="Add Customer" onPress={() => setShowCreate(true)} />}
    >
      <Card padding="none">
        <View style={styles.tableHeader}>
          {['Customer', 'Contact', 'Orders', 'Total Spent', 'Last Order', ''].map((h) => (
            <Typography key={h} variant="overline" style={styles.th}>
              {h}
            </Typography>
          ))}
        </View>

        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.row}>
                <View style={styles.avatarGroup}>
                  <Skeleton width={36} height={36} borderRadius={18} />
                  <View style={{ gap: 4 }}>
                    <Skeleton width={100} height={13} />
                    <Skeleton width={70} height={11} />
                  </View>
                </View>
                <Skeleton width="15%" height={13} />
                <Skeleton width="10%" height={13} />
                <Skeleton width="15%" height={13} />
                <Skeleton width="18%" height={13} />
              </View>
            ))
          : customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                onSelect={() => setSelectedId(customer.id)}
              />
            ))}

        {!isLoading && customers.length === 0 && (
          <View style={styles.empty}>
            <Typography variant="heading4" color="secondary">No customers yet</Typography>
            <Typography variant="body" color="tertiary">Add your first customer to get started.</Typography>
          </View>
        )}
      </Card>

      {selectedId && (
        <CustomerDetailModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      <AddCustomerModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </PageLayout>
  );
}

function CustomerRow({
  customer,
  onSelect,
}: {
  customer: CustomerWithStats;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ hovered }: { hovered?: boolean }) => [
        styles.row,
        hovered && styles.rowHover,
      ]}
    >
      <View style={styles.avatarGroup}>
        <View style={styles.avatar}>
          <Typography style={styles.avatarText}>{initials(customer.name)}</Typography>
        </View>
        <View>
          <Typography variant="bodyMedium">{customer.name}</Typography>
          {customer.email && (
            <Typography variant="caption" color="secondary">{customer.email}</Typography>
          )}
        </View>
      </View>
      <Typography variant="body" color="secondary" style={styles.td}>
        {customer.phone ?? '—'}
      </Typography>
      <Typography variant="bodySemiBold" style={styles.td}>
        {customer.orderCount}
      </Typography>
      <Typography variant="bodySemiBold" color="brand" style={styles.td}>
        {formatCurrency(customer.totalSpentCents)}
      </Typography>
      <Typography variant="caption" color="secondary" style={styles.td}>
        {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}
      </Typography>
      <Button label="View" size="sm" variant="ghost" onPress={onSelect} />
    </Pressable>
  );
}

function CustomerDetailModal({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api.customers.get(customerId),
  });

  return (
    <Modal
      visible
      onClose={onClose}
      title={data?.name ?? 'Customer'}
      footer={<Button label="Close" variant="ghost" onPress={onClose} />}
    >
      {isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={16} />
          <Skeleton height={16} width="70%" />
          <Skeleton height={16} width="50%" />
        </View>
      ) : data ? (
        <View style={styles.detailBody}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Typography variant="overline">Orders</Typography>
              <Typography variant="heading2">{data.orderCount}</Typography>
            </View>
            <View style={styles.stat}>
              <Typography variant="overline">Total Spent</Typography>
              <Typography variant="heading2" color="brand">
                {formatCurrency(data.totalSpentCents)}
              </Typography>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.contactBox}>
            {data.email && (
              <View style={styles.contactRow}>
                <Typography variant="label" color="secondary">Email</Typography>
                <Typography variant="body">{data.email}</Typography>
              </View>
            )}
            {data.phone && (
              <View style={styles.contactRow}>
                <Typography variant="label" color="secondary">Phone</Typography>
                <Typography variant="body">{data.phone}</Typography>
              </View>
            )}
            {data.notes && (
              <View style={styles.contactRow}>
                <Typography variant="label" color="secondary">Notes</Typography>
                <Typography variant="body">{data.notes}</Typography>
              </View>
            )}
          </View>

          {/* Recent orders */}
          {data.recentOrders.length > 0 && (
            <View>
              <Typography variant="heading4" style={{ marginBottom: 12 }}>
                Recent Orders
              </Typography>
              {data.recentOrders.map((order) => (
                <View key={order.id} style={styles.orderRow}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyMedium">
                      {order.items.map((i) => i.menuItem.name).join(', ')}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <OrderStatusBadge status={order.status} size="sm" />
                    <Typography variant="bodySemiBold">
                      {formatCurrency(order.totalCents)}
                    </Typography>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </Modal>
  );
}

function AddCustomerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: () => api.customers.create({ name, email: email || undefined, phone: phone || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast('Customer added', 'success');
      setName(''); setEmail(''); setPhone('');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Add Customer"
      width={440}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button label="Add Customer" onPress={() => { if (validate()) create.mutate(); }} loading={create.isPending} />
        </View>
      }
    >
      <View style={{ gap: spacing[4] }}>
        <Input label="Name *" value={name} onChangeText={setName} error={errors.name} placeholder="Full name" />
        <Input label="Email" value={email} onChangeText={setEmail} error={errors.email} placeholder="email@example.com" keyboardType="email-address" />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[50],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[3],
  },
  rowHover: { backgroundColor: colors.neutral[50] },
  avatarGroup: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.brand[800],
  },
  th: { flex: 1 },
  td: { flex: 1 },
  empty: {
    padding: spacing[10],
    alignItems: 'center',
    gap: spacing[2],
  },
  detailBody: { gap: spacing[5] },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  stat: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: spacing[4],
    gap: spacing[1],
  },
  contactBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: spacing[4],
    gap: spacing[3],
  },
  contactRow: { gap: spacing[0.5] },
  orderRow: {
    flexDirection: 'row',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[3],
  },
});
