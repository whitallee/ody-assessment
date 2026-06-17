import { useState, useEffect } from 'react';
import { View, ScrollView, Switch, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '@ody/shared';
import {
  useGetSettings,
  usePutSettings,
  getGetSettingsQueryKey,
  type PutSettingsBody,
} from '@ody/api-client';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import type { Settings } from '@/lib/types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settingsResponse, isLoading } = useGetSettings();
  const serverData = settingsResponse?.data as Settings | undefined;

  const [form, setForm] = useState<Partial<Settings>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (serverData) {
      setForm(serverData);
      setDirty(false);
    }
  }, [serverData]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function updateHours(
    day: (typeof DAYS)[number],
    field: 'open' | 'close' | 'isClosed',
    value: string | boolean,
  ) {
    const current = form.openingHours ?? {};
    setForm((prev) => ({
      ...prev,
      openingHours: {
        ...current,
        [day]: {
          ...(current[day] ?? { open: '09:00', close: '22:00', isClosed: false }),
          [field]: value,
        },
      },
    }));
    setDirty(true);
  }

  const save = usePutSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        setDirty(false);
        toast('Settings saved', 'success');
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  if (isLoading) {
    return (
      <PageLayout title="Settings">
        <View style={{ gap: spacing[6] }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton height={16} width="30%" />
              <View style={{ height: 16 }} />
              <Skeleton height={40} />
              <View style={{ height: 12 }} />
              <Skeleton height={40} />
            </Card>
          ))}
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Settings"
      subtitle="Restaurant configuration"
      actions={
        dirty && (
          <Button
            label="Save Changes"
            onPress={() => save.mutate({ data: form as unknown as PutSettingsBody })}
            loading={save.isPending}
          />
        )
      }
    >
      {/* Restaurant Info */}
      <Card>
        <Section title="Restaurant Info">
          <View style={styles.fieldRow}>
            <Input
              label="Restaurant Name"
              value={form.restaurantName ?? ''}
              onChangeText={(v) => update('restaurantName', v)}
              style={styles.flex}
            />
            <Input
              label="Phone"
              value={form.restaurantPhone ?? ''}
              onChangeText={(v) => update('restaurantPhone', v)}
              style={styles.flex}
              keyboardType="phone-pad"
            />
          </View>
          <Input
            label="Address"
            value={form.restaurantAddress ?? ''}
            onChangeText={(v) => update('restaurantAddress', v)}
          />
        </Section>
      </Card>

      {/* Ordering Settings */}
      <Card>
        <Section title="Ordering">
          <View style={styles.fieldRow}>
            <View style={styles.flex}>
              <Input
                label="Default Prep Time (minutes)"
                value={String(form.prepTimeMinutes ?? 20)}
                onChangeText={(v) => update('prepTimeMinutes', parseInt(v, 10) || 20)}
                keyboardType="number-pad"
                hint="Applied to new orders without a custom prep time"
              />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Typography variant="bodyMedium">Auto-Accept Orders</Typography>
              <Typography variant="caption" color="secondary">
                Automatically accept new orders without manual review
              </Typography>
            </View>
            <Switch
              value={form.autoAcceptOrders ?? false}
              onValueChange={(v) => update('autoAcceptOrders', v)}
              thumbColor={form.autoAcceptOrders ? colors.brand[500] : colors.neutral[300]}
              trackColor={{ true: colors.brand[200], false: colors.neutral[200] }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Typography variant="bodyMedium">Restaurant Open</Typography>
              <Typography variant="caption" color="secondary">
                When off, new orders cannot be placed
              </Typography>
            </View>
            <Switch
              value={form.isOpen ?? true}
              onValueChange={(v) => update('isOpen', v)}
              thumbColor={form.isOpen ? colors.success[500] : colors.neutral[300]}
              trackColor={{ true: colors.success[50], false: colors.neutral[200] }}
            />
          </View>
        </Section>
      </Card>

      {/* Opening Hours */}
      <Card>
        <Section title="Opening Hours">
          {DAYS.map((day) => {
            const hours = form.openingHours?.[day] ?? { open: '09:00', close: '22:00', isClosed: false };
            return (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayLabel}>
                  <Typography variant="bodyMedium">{DAY_LABELS[day]}</Typography>
                </View>
                <Switch
                  value={!hours.isClosed}
                  onValueChange={(v) => updateHours(day, 'isClosed', !v)}
                  thumbColor={!hours.isClosed ? colors.brand[500] : colors.neutral[300]}
                  trackColor={{ true: colors.brand[200], false: colors.neutral[200] }}
                />
                {!hours.isClosed ? (
                  <View style={styles.timeRow}>
                    <Input
                      value={hours.open}
                      onChangeText={(v) => updateHours(day, 'open', v)}
                      placeholder="09:00"
                      style={styles.timeInput}
                    />
                    <Typography variant="body" color="secondary">to</Typography>
                    <Input
                      value={hours.close}
                      onChangeText={(v) => updateHours(day, 'close', v)}
                      placeholder="22:00"
                      style={styles.timeInput}
                    />
                  </View>
                ) : (
                  <Typography variant="body" color="tertiary" style={styles.closedLabel}>
                    Closed
                  </Typography>
                )}
              </View>
            );
          })}
        </Section>
      </Card>

      {dirty && (
        <View style={styles.saveBar}>
          <Typography variant="bodyMedium" color="secondary">
            You have unsaved changes
          </Typography>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Button
              label="Discard"
              variant="ghost"
              onPress={() => { if (serverData) { setForm(serverData); setDirty(false); } }}
            />
            <Button
              label="Save Changes"
              onPress={() => save.mutate({ data: form as unknown as PutSettingsBody })}
              loading={save.isPending}
            />
          </View>
        </View>
      )}
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  flex: { flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  toggleInfo: { flex: 1, marginRight: spacing[4] },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  dayLabel: { width: 100 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  timeInput: { width: 80 } as object,
  closedLabel: { flex: 1 },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: spacing[4],
  },
});
