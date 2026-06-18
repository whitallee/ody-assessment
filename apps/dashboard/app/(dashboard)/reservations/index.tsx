import { useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, formatDate } from '@ody/shared';
import {
  useGetReservations,
  usePatchReservationsIdStatus,
  usePostReservations,
  getGetReservationsQueryKey,
} from '@ody/api-client';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import type { Reservation, ReservationStatus } from '@/lib/types';

const STATUS_FILTERS: { label: string; value: ReservationStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Seated', value: 'seated' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No Show', value: 'no_show' },
];

const NEXT_ACTIONS: Record<ReservationStatus, { label: string; status: ReservationStatus }[]> = {
  pending: [
    { label: 'Confirm', status: 'confirmed' },
    { label: 'Cancel', status: 'cancelled' },
  ],
  confirmed: [
    { label: 'Seat', status: 'seated' },
    { label: 'No Show', status: 'no_show' },
    { label: 'Cancel', status: 'cancelled' },
  ],
  seated: [{ label: 'Complete', status: 'completed' }],
  completed: [],
  cancelled: [],
  no_show: [],
};

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: colors.warning[500],
  confirmed: colors.brand[500],
  seated: colors.info[500],
  completed: colors.success[500],
  cancelled: colors.neutral[400],
  no_show: colors.error[500],
};

export default function ReservationsPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: resResponse, isLoading } = useGetReservations(
    statusFilter !== 'all' ? { status: statusFilter } : undefined,
  );
  const reservations = (resResponse?.data.data ?? []) as Reservation[];
  const selected = reservations.find((r) => r.id === selectedId) ?? null;

  return (
    <PageLayout
      title="Reservations"
      subtitle={`${resResponse?.data.total ?? 0} total`}
      actions={<Button label="New Reservation" onPress={() => setShowCreate(true)} />}
    >
      {/* Status filter tabs */}
      <View style={styles.filters}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            style={[styles.filterTab, statusFilter === f.value && styles.filterTabActive]}
          >
            <Typography
              variant="caption"
              style={statusFilter === f.value ? styles.filterLabelActive : styles.filterLabel}
            >
              {f.label}
            </Typography>
          </Pressable>
        ))}
      </View>

      <Card padding="none">
        {isMobile ? (
          /* ── Mobile: card-based list ── */
          <>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={styles.reservationCard}>
                    <View style={styles.reservationCardHeader}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Skeleton width="40%" height={13} />
                        <Skeleton width="25%" height={11} />
                      </View>
                      <Skeleton width={70} height={22} borderRadius={6} />
                    </View>
                    <View style={styles.reservationCardMeta}>
                      <Skeleton width="15%" height={11} />
                      <Skeleton width="45%" height={11} />
                    </View>
                  </View>
                ))
              : reservations.map((r) => (
                  <Pressable
                    key={r.id}
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.reservationCard,
                      hovered && styles.rowHover,
                    ]}
                    onPress={() => setSelectedId(r.id)}
                  >
                    <View style={styles.reservationCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="bodyMedium">{r.customerName}</Typography>
                        {r.customerPhone && (
                          <Typography variant="caption" color="secondary">{r.customerPhone}</Typography>
                        )}
                      </View>
                      <ReservationBadge status={r.status as ReservationStatus} />
                    </View>
                    <View style={styles.reservationCardMeta}>
                      <Typography variant="caption" color="secondary">
                        Party of {r.partySize}
                      </Typography>
                      <Typography variant="caption" color="secondary"> · </Typography>
                      <Typography variant="caption" color="secondary">
                        {formatDate(r.reservationDate)}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {' '}
                        {new Date(r.reservationDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      {r.tableNumber != null && (
                        <>
                          <Typography variant="caption" color="secondary"> · </Typography>
                          <Typography variant="caption" color="secondary">
                            Table {r.tableNumber}
                          </Typography>
                        </>
                      )}
                    </View>
                  </Pressable>
                ))}
          </>
        ) : (
          /* ── Desktop: table layout ── */
          <>
            <View style={styles.tableHeader}>
              {['Guest', 'Party', 'Date & Time', 'Table', 'Status', ''].map((h) => (
                <Typography key={h} variant="overline" style={styles.th}>
                  {h}
                </Typography>
              ))}
            </View>

            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={styles.row}>
                    <Skeleton width="20%" height={13} />
                    <Skeleton width="8%" height={13} />
                    <Skeleton width="22%" height={13} />
                    <Skeleton width="10%" height={13} />
                    <Skeleton width={70} height={22} borderRadius={6} />
                  </View>
                ))
              : reservations.map((r) => (
                  <ReservationRow key={r.id} reservation={r} onSelect={() => setSelectedId(r.id)} />
                ))}
          </>
        )}

        {!isLoading && reservations.length === 0 && (
          <View style={styles.empty}>
            <Typography variant="heading4" color="secondary">No reservations</Typography>
            <Typography variant="body" color="tertiary">
              {statusFilter === 'all'
                ? 'Create the first reservation to get started.'
                : `No reservations with status "${statusFilter}".`}
            </Typography>
          </View>
        )}
      </Card>

      {selected && (
        <ReservationDetailModal
          reservation={selected}
          onClose={() => setSelectedId(null)}
        />
      )}

      <CreateReservationModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </PageLayout>
  );
}

function ReservationRow({
  reservation: r,
  onSelect,
}: {
  reservation: Reservation;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ hovered }: { hovered?: boolean }) => [styles.row, hovered && styles.rowHover]}
    >
      <View style={styles.guestCell}>
        <Typography variant="bodyMedium">{r.customerName}</Typography>
        {r.customerPhone && (
          <Typography variant="caption" color="secondary">{r.customerPhone}</Typography>
        )}
      </View>
      <Typography variant="bodySemiBold" style={styles.td}>
        {r.partySize}
      </Typography>
      <View style={styles.td}>
        <Typography variant="bodyMedium">{formatDate(r.reservationDate)}</Typography>
        <Typography variant="caption" color="secondary">
          {new Date(r.reservationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </View>
      <Typography variant="body" color="secondary" style={styles.td}>
        {r.tableNumber ?? '—'}
      </Typography>
      <View style={styles.td}>
        <ReservationBadge status={r.status as ReservationStatus} />
      </View>
      <Button label="View" size="sm" variant="ghost" onPress={onSelect} />
    </Pressable>
  );
}

function ReservationBadge({ status }: { status: ReservationStatus }) {
  const labels: Record<ReservationStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    seated: 'Seated',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] + '20' }]}>
      <Typography style={[styles.badgeText, { color: STATUS_COLORS[status] }]}>
        {labels[status]}
      </Typography>
    </View>
  );
}

function ReservationDetailModal({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const updateStatus = usePatchReservationsIdStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
        toast('Status updated', 'success');
        onClose();
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  const actions = NEXT_ACTIONS[reservation.status as ReservationStatus];

  return (
    <Modal
      visible
      onClose={onClose}
      title={reservation.customerName}
      width={480}
      footer={
        <View style={styles.modalFooter}>
          {actions.map((a) => (
            <Button
              key={a.status}
              label={a.label}
              variant={a.status === 'cancelled' || a.status === 'no_show' ? 'ghost' : 'primary'}
              onPress={() => updateStatus.mutate({ id: reservation.id, data: { status: a.status } })}
              loading={updateStatus.isPending}
            />
          ))}
          <Button label="Close" variant="ghost" onPress={onClose} />
        </View>
      }
    >
      <View style={styles.detailBody}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Typography variant="overline">Party Size</Typography>
            <Typography variant="heading2">{reservation.partySize}</Typography>
          </View>
          <View style={styles.stat}>
            <Typography variant="overline">Status</Typography>
            <ReservationBadge status={reservation.status as ReservationStatus} />
          </View>
          {reservation.tableNumber && (
            <View style={styles.stat}>
              <Typography variant="overline">Table</Typography>
              <Typography variant="heading2">{reservation.tableNumber}</Typography>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Typography variant="label" color="secondary">Date & Time</Typography>
            <Typography variant="body">
              {formatDate(reservation.reservationDate)}{' '}
              {new Date(reservation.reservationDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </View>
          {reservation.customerPhone && (
            <View style={styles.infoRow}>
              <Typography variant="label" color="secondary">Phone</Typography>
              <Typography variant="body">{reservation.customerPhone}</Typography>
            </View>
          )}
          {reservation.notes && (
            <View style={styles.infoRow}>
              <Typography variant="label" color="secondary">Notes</Typography>
              <Typography variant="body">{reservation.notes}</Typography>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function CreateReservationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = usePostReservations({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
        toast('Reservation created', 'success');
        setName(''); setPhone(''); setPartySize('2'); setDate(''); setTime('19:00');
        setTableNumber(''); setNotes('');
        onClose();
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Guest name is required';
    if (!date) e.date = 'Date is required';
    const ps = parseInt(partySize, 10);
    if (isNaN(ps) || ps < 1) e.partySize = 'Party size must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New Reservation"
      width={480}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button
            label="Create Reservation"
            onPress={() => {
              if (!validate()) return;
              const reservationDate = new Date(`${date}T${time}:00`).toISOString();
              create.mutate({
                data: {
                  customerName: name,
                  customerPhone: phone || undefined,
                  partySize: parseInt(partySize, 10),
                  reservationDate,
                  tableNumber: tableNumber || undefined,
                  notes: notes || undefined,
                },
              });
            }}
            loading={create.isPending}
          />
        </View>
      }
    >
      <View style={{ gap: spacing[4] }}>
        <Input
          label="Guest Name *"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Full name"
        />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          keyboardType="phone-pad"
        />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input
              label="Date *"
              value={date}
              onChangeText={setDate}
              error={errors.date}
              placeholder="2025-12-31"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Time"
              value={time}
              onChangeText={setTime}
              placeholder="19:00"
            />
          </View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Input
              label="Party Size *"
              value={partySize}
              onChangeText={setPartySize}
              error={errors.partySize}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Table #"
              value={tableNumber}
              onChangeText={setTableNumber}
              placeholder="e.g. 12"
            />
          </View>
        </View>
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Allergies, special occasions..."
          multiline
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterTab: {
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: colors.brand[500],
  },
  filterLabel: {
    color: colors.neutral[600],
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  filterLabelActive: {
    color: colors.neutral[0],
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[3],
  },
  row2: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  rowHover: { backgroundColor: colors.neutral[50] },
  guestCell: { flex: 2, gap: 2 },
  th: { flex: 1 },
  td: { flex: 1 },
  empty: {
    padding: spacing[10],
    alignItems: 'center',
    gap: spacing[2],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
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
    gap: spacing[2],
  },
  infoBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: spacing[4],
    gap: spacing[3],
  },
  infoRow: { gap: spacing[0.5] },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  reservationCard: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[2],
  },
  reservationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  reservationCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
