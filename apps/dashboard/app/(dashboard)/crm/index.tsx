import { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView as RNScrollView } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fontFamily, fontSize, formatCurrency, formatDate } from '@ody/shared';
import {
  useGetCustomers,
  useGetCustomersId,
  usePostCustomers,
  useGetRewards,
  useGetLoyaltyCustomerId,
  usePostLoyaltyCustomerIdAdjust,
  usePostLoyaltyCustomerIdRedeem,
  getGetCustomersQueryKey,
  getGetLoyaltyCustomerIdQueryKey,
} from '@ody/api-client';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { initials } from '@ody/shared';
import type { CustomerWithStats, CustomerDetail, LoyaltyBalance, LoyaltyTransaction, Reward } from '@/lib/types';

type DetailTab = 'overview' | 'loyalty';

export default function CrmPage() {
  const { data: customersResponse, isLoading } = useGetCustomers({ limit: 100 });
  const customers = (customersResponse?.data.data ?? []) as CustomerWithStats[];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <PageLayout
      title="CRM"
      subtitle={`${customersResponse?.data.total ?? 0} customers`}
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
  const [tab, setTab] = useState<DetailTab>('overview');

  const { data: customerResponse, isLoading } = useGetCustomersId(customerId);
  const data = customerResponse?.data as CustomerDetail | undefined;

  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'loyalty', label: '🎁 Loyalty' },
  ];

  return (
    <Modal
      visible
      onClose={onClose}
      title={data?.name ?? 'Customer'}
      width={600}
      footer={<Button label="Close" variant="ghost" onPress={onClose} />}
    >
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
          >
            <Typography
              style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}
            >
              {t.label}
            </Typography>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={{ gap: 12, paddingTop: spacing[2] }}>
          <Skeleton height={16} />
          <Skeleton height={16} width="70%" />
          <Skeleton height={16} width="50%" />
        </View>
      ) : data ? (
        tab === 'overview' ? (
          <OverviewTab data={data} />
        ) : (
          <LoyaltyTab customerId={customerId} />
        )
      ) : null}
    </Modal>
  );
}

function OverviewTab({ data }: { data: CustomerDetail }) {
  return (
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
                <OrderStatusBadge status={order.status as never} size="sm" />
                <Typography variant="bodySemiBold">
                  {formatCurrency(order.totalCents)}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function LoyaltyTab({ customerId }: { customerId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showRedeem, setShowRedeem] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  const { data: loyaltyResponse, isLoading } = useGetLoyaltyCustomerId(customerId);
  const loyalty = loyaltyResponse?.data as LoyaltyBalance | undefined;

  const adjust = usePostLoyaltyCustomerIdAdjust({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetLoyaltyCustomerIdQueryKey(customerId) });
        toast('Points adjusted', 'success');
        setAdjustPoints('');
        setAdjustDesc('');
        setShowAdjust(false);
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  if (isLoading) {
    return (
      <View style={{ gap: 12, paddingTop: spacing[2] }}>
        <Skeleton height={80} borderRadius={10} />
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={40} />
      </View>
    );
  }

  if (!loyalty) return null;

  return (
    <View style={styles.loyaltyBody}>
      {/* Balance stats */}
      <View style={styles.balanceRow}>
        <View style={[styles.balanceStat, styles.balanceStatMain]}>
          <Typography variant="overline">Current Balance</Typography>
          <Typography style={styles.balanceBig}>{loyalty.pointsBalance.toLocaleString()}</Typography>
          <Typography variant="caption" color="secondary">points</Typography>
        </View>
        <View style={styles.balanceStat}>
          <Typography variant="overline">Total Earned</Typography>
          <Typography variant="heading3" color="brand">{loyalty.totalEarned.toLocaleString()}</Typography>
        </View>
        <View style={styles.balanceStat}>
          <Typography variant="overline">Total Redeemed</Typography>
          <Typography variant="heading3">{loyalty.totalRedeemed.toLocaleString()}</Typography>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.loyaltyActions}>
        <Button
          label="Redeem Reward"
          size="sm"
          variant="outline"
          onPress={() => { setShowRedeem(true); setShowAdjust(false); }}
        />
        <Button
          label="Adjust Points"
          size="sm"
          variant="ghost"
          onPress={() => { setShowAdjust(!showAdjust); setShowRedeem(false); }}
        />
      </View>

      {/* Redeem reward picker */}
      {showRedeem && (
        <RedeemPanel
          customerId={customerId}
          balance={loyalty.pointsBalance}
          onClose={() => setShowRedeem(false)}
        />
      )}

      {/* Adjust points inline form */}
      {showAdjust && (
        <View style={styles.adjustForm}>
          <Typography variant="label" color="secondary" style={{ marginBottom: spacing[3] }}>
            Adjust Points — use negative values to deduct
          </Typography>
          <View style={{ gap: spacing[3] }}>
            <Input
              label="Points"
              value={adjustPoints}
              onChangeText={setAdjustPoints}
              keyboardType="number-pad"
              placeholder="e.g. 100 or -50"
            />
            <Input
              label="Reason"
              value={adjustDesc}
              onChangeText={setAdjustDesc}
              placeholder="e.g. Goodwill adjustment"
            />
            <View style={{ flexDirection: 'row', gap: spacing[2], justifyContent: 'flex-end' }}>
              <Button label="Cancel" size="sm" variant="ghost" onPress={() => setShowAdjust(false)} />
              <Button
                label="Apply"
                size="sm"
                onPress={() => {
                  if (!adjustPoints || isNaN(parseInt(adjustPoints, 10))) {
                    toast('Enter a valid number', 'error');
                    return;
                  }
                  adjust.mutate({
                    customerId,
                    data: {
                      points: parseInt(adjustPoints, 10),
                      description: adjustDesc || 'Manual adjustment',
                    },
                  });
                }}
                loading={adjust.isPending}
              />
            </View>
          </View>
        </View>
      )}

      {/* Transaction history */}
      <View>
        <Typography variant="heading4" style={{ marginBottom: spacing[3] }}>
          Transaction History
        </Typography>
        {loyalty.transactions.length === 0 ? (
          <View style={styles.txEmpty}>
            <Typography variant="body" color="tertiary">No transactions yet.</Typography>
          </View>
        ) : (
          (loyalty.transactions as unknown as LoyaltyTransaction[]).map((tx) => (
            <TxRow key={tx.id} tx={tx} />
          ))
        )}
      </View>
    </View>
  );
}

function RedeemPanel({
  customerId,
  balance,
  onClose,
}: {
  customerId: string;
  balance: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: rewardsResponse, isLoading } = useGetRewards({ active: true });
  const rewards = (rewardsResponse?.data ?? []) as Reward[];

  const redeem = usePostLoyaltyCustomerIdRedeem({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetLoyaltyCustomerIdQueryKey(customerId) });
        toast('Reward redeemed!', 'success');
        onClose();
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  return (
    <View style={styles.redeemPanel}>
      <View style={styles.redeemHeader}>
        <Typography variant="label">Select a Reward to Redeem</Typography>
        <Pressable onPress={onClose}>
          <Typography style={styles.redeemClose}>✕</Typography>
        </Pressable>
      </View>
      {isLoading ? (
        <Skeleton height={60} borderRadius={8} />
      ) : rewards.length === 0 ? (
        <Typography variant="caption" color="secondary">No active rewards defined.</Typography>
      ) : (
        <RNScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
          {rewards.map((reward) => {
            const canAfford = balance >= reward.pointsCost;
            return (
              <Pressable
                key={reward.id}
                disabled={!canAfford || redeem.isPending}
                onPress={() => redeem.mutate({ customerId, data: { rewardId: reward.id } })}
                style={[styles.rewardOption, !canAfford && styles.rewardOptionDisabled]}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyMedium" style={!canAfford ? { color: colors.neutral[400] } : undefined}>
                    {reward.name}
                  </Typography>
                  {reward.description && (
                    <Typography variant="caption" color="secondary">{reward.description}</Typography>
                  )}
                </View>
                <View style={[styles.costBadge, !canAfford && styles.costBadgeDisabled]}>
                  <Typography style={[styles.costText, !canAfford && { color: colors.neutral[400] }]}>
                    {reward.pointsCost.toLocaleString()} pts
                  </Typography>
                </View>
              </Pressable>
            );
          })}
        </RNScrollView>
      )}
    </View>
  );
}

const TX_TYPE_CONFIG = {
  earn: { label: 'Earn', bg: colors.success[50], text: colors.success[700], sign: '+' },
  redeem: { label: 'Redeem', bg: colors.warning[50], text: colors.warning[700], sign: '-' },
  adjustment: { label: 'Adjust', bg: colors.info[50], text: colors.info[700], sign: '' },
  expire: { label: 'Expire', bg: colors.neutral[100], text: colors.neutral[500], sign: '-' },
};

function TxRow({ tx }: { tx: LoyaltyTransaction }) {
  const cfg = TX_TYPE_CONFIG[tx.type as keyof typeof TX_TYPE_CONFIG] ?? TX_TYPE_CONFIG.adjustment;
  const isPositive = tx.points > 0;
  const signedPoints = isPositive ? `+${tx.points.toLocaleString()}` : tx.points.toLocaleString();

  return (
    <View style={styles.txRow}>
      <View style={[styles.txTypePill, { backgroundColor: cfg.bg }]}>
        <Typography style={[styles.txTypeText, { color: cfg.text }]}>{cfg.label}</Typography>
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="body">{tx.description}</Typography>
        <Typography variant="caption" color="secondary">{formatDate(tx.createdAt)}</Typography>
      </View>
      <Typography
        style={[
          styles.txPoints,
          { color: isPositive ? colors.success[600] : colors.warning[600] },
        ]}
      >
        {signedPoints}
      </Typography>
    </View>
  );
}

function AddCustomerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = usePostCustomers({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCustomersQueryKey() });
        toast('Customer added', 'success');
        setName(''); setEmail(''); setPhone('');
        onClose();
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
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
          <Button label="Add Customer" onPress={() => {
            if (!validate()) return;
            create.mutate({ data: { name, email: email || undefined, phone: phone || undefined } });
          }} loading={create.isPending} />
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

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    marginBottom: spacing[4],
    marginTop: -spacing[2],
  },
  tabItem: {
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabItemActive: {
    borderBottomColor: colors.brand[500],
  },
  tabLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  tabLabelActive: {
    fontFamily: fontFamily.bodySemiBold,
    color: colors.brand[600],
  },

  // Overview tab
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

  // Loyalty tab
  loyaltyBody: { gap: spacing[5] },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  balanceStat: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: spacing[4],
    gap: spacing[1],
  },
  balanceStatMain: {
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  balanceBig: {
    fontFamily: fontFamily.display,
    fontSize: 32,
    color: colors.brand[700],
    lineHeight: 36,
  },
  loyaltyActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  adjustForm: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[3],
  },
  txTypePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  txTypeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  txPoints: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    minWidth: 60,
    textAlign: 'right',
  },
  txEmpty: {
    padding: spacing[4],
    alignItems: 'center',
  },
  redeemPanel: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  redeemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  redeemClose: {
    fontSize: 16,
    color: colors.neutral[400],
    padding: 4,
  },
  rewardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: spacing[3],
  },
  rewardOptionDisabled: { opacity: 0.5 },
  costBadge: {
    backgroundColor: colors.brand[50],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  costBadgeDisabled: { backgroundColor: colors.neutral[100] },
  costText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.brand[700],
  },
});
