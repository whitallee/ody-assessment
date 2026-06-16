import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, formatCurrency } from '@ody/shared';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { api, type Reward } from '@/lib/api';

type RewardType = 'discount_percent' | 'discount_fixed' | 'free_item';

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  discount_percent: '% Discount',
  discount_fixed: 'Fixed Discount',
  free_item: 'Free Item',
};

const REWARD_TYPE_COLORS: Record<RewardType, string> = {
  discount_percent: colors.brand[500],
  discount_fixed: colors.success[500],
  free_item: colors.info[500],
};

export default function RewardsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editReward, setEditReward] = useState<Reward | null>(null);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => api.rewards.list(),
  });

  const active = rewards.filter((r) => r.isActive);
  const inactive = rewards.filter((r) => !r.isActive);

  return (
    <PageLayout
      title="Rewards Program"
      subtitle={`${active.length} active reward${active.length !== 1 ? 's' : ''}`}
      actions={<Button label="New Reward" onPress={() => setShowCreate(true)} />}
    >
      {/* Points earn rate info card */}
      <EarnRateCard />

      {/* Active rewards */}
      <Typography variant="heading4" style={styles.sectionTitle}>Active Rewards</Typography>
      {isLoading ? (
        <View style={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={140} borderRadius={16} />)}
        </View>
      ) : active.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <Typography variant="body" color="tertiary">No active rewards. Create one to get started.</Typography>
          </View>
        </Card>
      ) : (
        <View style={styles.grid}>
          {active.map((r) => (
            <RewardCard key={r.id} reward={r} onEdit={() => setEditReward(r)} />
          ))}
        </View>
      )}

      {/* Inactive rewards */}
      {inactive.length > 0 && (
        <>
          <Typography variant="heading4" style={styles.sectionTitle}>Inactive</Typography>
          <View style={styles.grid}>
            {inactive.map((r) => (
              <RewardCard key={r.id} reward={r} onEdit={() => setEditReward(r)} />
            ))}
          </View>
        </>
      )}

      <CreateRewardModal visible={showCreate} onClose={() => setShowCreate(false)} />
      {editReward && (
        <EditRewardModal reward={editReward} onClose={() => setEditReward(null)} />
      )}
    </PageLayout>
  );
}

function EarnRateCard() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
  });

  return (
    <Card variant="elevated" style={styles.earnCard}>
      <View style={styles.earnRow}>
        <View style={styles.earnStat}>
          <Typography variant="overline">Points Per Dollar</Typography>
          <Typography variant="heading2" color="brand">
            {settings?.loyaltyPointsPerDollar ?? 10}
          </Typography>
          <Typography variant="caption" color="secondary">Earned on every order</Typography>
        </View>
        <View style={styles.earnDivider} />
        <View style={styles.earnStat}>
          <Typography variant="overline">Program Status</Typography>
          <View style={[styles.statusPill, { backgroundColor: settings?.loyaltyEnabled ? colors.success[500] + '20' : colors.neutral[100] }]}>
            <Typography style={[styles.statusPillText, { color: settings?.loyaltyEnabled ? colors.success[600] : colors.neutral[500] }]}>
              {settings?.loyaltyEnabled ? 'Active' : 'Disabled'}
            </Typography>
          </View>
          <Typography variant="caption" color="secondary">Configure in Settings</Typography>
        </View>
        <View style={styles.earnDivider} />
        <View style={styles.earnStat}>
          <Typography variant="overline">How It Works</Typography>
          <Typography variant="body" color="secondary">
            Points are earned automatically when orders are marked completed.
          </Typography>
        </View>
      </View>
    </Card>
  );
}

function RewardCard({ reward, onEdit }: { reward: Reward; onEdit: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const toggle = useMutation({
    mutationFn: () => api.rewards.update(reward.id, { isActive: !reward.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards'] });
      toast(reward.isActive ? 'Reward deactivated' : 'Reward activated', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const typeColor = REWARD_TYPE_COLORS[reward.rewardType as RewardType] ?? colors.neutral[400];

  return (
    <Card style={[styles.rewardCard, !reward.isActive && styles.rewardCardInactive]} variant="elevated">
      <View style={[styles.rewardAccent, { backgroundColor: typeColor }]} />
      <View style={styles.rewardTypePill}>
        <Typography style={[styles.rewardTypeText, { color: typeColor }]}>
          {REWARD_TYPE_LABELS[reward.rewardType as RewardType] ?? reward.rewardType}
        </Typography>
      </View>
      <Typography variant="heading4" style={styles.rewardName}>{reward.name}</Typography>
      {reward.description && (
        <Typography variant="caption" color="secondary" style={styles.rewardDesc}>
          {reward.description}
        </Typography>
      )}
      <View style={styles.rewardMeta}>
        <View style={styles.pointsCostBadge}>
          <Typography style={styles.pointsCostText}>{reward.pointsCost} pts</Typography>
        </View>
        {reward.rewardType === 'discount_fixed' && reward.discountValue && (
          <Typography variant="bodyMedium" color="brand">{formatCurrency(reward.discountValue)} off</Typography>
        )}
        {reward.rewardType === 'discount_percent' && reward.discountValue && (
          <Typography variant="bodyMedium" color="brand">{reward.discountValue}% off</Typography>
        )}
      </View>
      <View style={styles.rewardActions}>
        <Button label="Edit" size="sm" variant="ghost" onPress={onEdit} />
        <Button
          label={reward.isActive ? 'Deactivate' : 'Activate'}
          size="sm"
          variant="outline"
          onPress={() => toggle.mutate()}
          loading={toggle.isPending}
        />
      </View>
    </Card>
  );
}

function CreateRewardModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>('discount_fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: () =>
      api.rewards.create({
        name,
        description: description || undefined,
        pointsCost: parseInt(pointsCost, 10),
        rewardType,
        discountValue: discountValue ? parseInt(discountValue, 10) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards'] });
      toast('Reward created', 'success');
      setName(''); setDescription(''); setPointsCost(''); setDiscountValue('');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!pointsCost || isNaN(parseInt(pointsCost, 10))) e.pointsCost = 'Valid points cost required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const TYPES: { value: RewardType; label: string }[] = [
    { value: 'discount_fixed', label: 'Fixed ($) Discount' },
    { value: 'discount_percent', label: 'Percentage Discount' },
    { value: 'free_item', label: 'Free Menu Item' },
  ];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New Reward"
      width={480}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button label="Create Reward" onPress={() => { if (validate()) create.mutate(); }} loading={create.isPending} />
        </View>
      }
    >
      <View style={{ gap: spacing[4] }}>
        <Input label="Name *" value={name} onChangeText={setName} error={errors.name} placeholder="e.g. Free Dessert" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="What the customer gets..." />
        <Input label="Points Cost *" value={pointsCost} onChangeText={setPointsCost} error={errors.pointsCost} keyboardType="number-pad" placeholder="e.g. 500" />

        <View>
          <Typography variant="label" color="secondary" style={{ marginBottom: spacing[2] }}>Reward Type</Typography>
          <View style={styles.typeSelector}>
            {TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setRewardType(t.value)}
                style={[styles.typeOption, rewardType === t.value && styles.typeOptionActive]}
              >
                <Typography style={rewardType === t.value ? styles.typeOptionTextActive : styles.typeOptionText}>
                  {t.label}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>

        {rewardType !== 'free_item' && (
          <Input
            label={rewardType === 'discount_fixed' ? 'Discount Amount (cents)' : 'Discount Percentage'}
            value={discountValue}
            onChangeText={setDiscountValue}
            keyboardType="number-pad"
            placeholder={rewardType === 'discount_fixed' ? 'e.g. 1000 = $10' : 'e.g. 15 = 15%'}
          />
        )}
      </View>
    </Modal>
  );
}

function EditRewardModal({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description ?? '');
  const [pointsCost, setPointsCost] = useState(String(reward.pointsCost));
  const [discountValue, setDiscountValue] = useState(String(reward.discountValue ?? ''));

  const update = useMutation({
    mutationFn: () =>
      api.rewards.update(reward.id, {
        name,
        description: description || undefined,
        pointsCost: parseInt(pointsCost, 10),
        discountValue: discountValue ? parseInt(discountValue, 10) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards'] });
      toast('Reward updated', 'success');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const del = useMutation({
    mutationFn: () => api.rewards.delete(reward.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards'] });
      toast('Reward deleted', 'success');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <Modal
      visible
      onClose={onClose}
      title={`Edit: ${reward.name}`}
      width={480}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Button label="Delete" variant="ghost" onPress={() => del.mutate()} loading={del.isPending} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button label="Cancel" variant="ghost" onPress={onClose} />
            <Button label="Save" onPress={() => update.mutate()} loading={update.isPending} />
          </View>
        </View>
      }
    >
      <View style={{ gap: spacing[4] }}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Description" value={description} onChangeText={setDescription} />
        <Input label="Points Cost" value={pointsCost} onChangeText={setPointsCost} keyboardType="number-pad" />
        {reward.rewardType !== 'free_item' && (
          <Input
            label={reward.rewardType === 'discount_fixed' ? 'Discount Amount (cents)' : 'Discount Percentage'}
            value={discountValue}
            onChangeText={setDiscountValue}
            keyboardType="number-pad"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginBottom: spacing[3], marginTop: spacing[2] },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  rewardCard: {
    flex: 1,
    minWidth: 220,
    maxWidth: 320,
    position: 'relative',
    overflow: 'hidden',
    gap: spacing[2],
  },
  rewardCardInactive: { opacity: 0.6 },
  rewardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rewardTypePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral[100],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginTop: spacing[2],
  },
  rewardTypeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  rewardName: { marginTop: spacing[1] },
  rewardDesc: { marginTop: spacing[0.5] },
  rewardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[1] },
  pointsCostBadge: {
    backgroundColor: colors.brand[50],
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  pointsCostText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.brand[700] },
  rewardActions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] },
  empty: { alignItems: 'center', padding: spacing[6] },
  earnCard: { marginBottom: spacing[4] },
  earnRow: { flexDirection: 'row', gap: spacing[4], flexWrap: 'wrap' },
  earnStat: { flex: 1, minWidth: 150, gap: spacing[1] },
  earnDivider: { width: 1, backgroundColor: colors.neutral[100] },
  statusPill: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  statusPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  typeSelector: { gap: spacing[2] },
  typeOption: {
    padding: spacing[3],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  typeOptionActive: {
    borderColor: colors.brand[400],
    backgroundColor: colors.brand[50],
  },
  typeOptionText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.neutral[600] },
  typeOptionTextActive: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.brand[700] },
});
