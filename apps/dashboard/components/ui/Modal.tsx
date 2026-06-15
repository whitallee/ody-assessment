import {
  Modal as RNModal,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radius, shadow, spacing, zIndex } from '@ody/shared';
import { Typography } from './Typography';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function Modal({ visible, onClose, title, children, footer, width = 560 }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.dialog, { maxWidth: width }]}>
          {title && (
            <View style={styles.header}>
              <Typography variant="heading3">{title}</Typography>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Typography style={styles.closeText}>✕</Typography>
              </Pressable>
            </View>
          )}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <View style={styles.confirmFooter}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button
            label={confirmLabel}
            variant={confirmVariant}
            onPress={onConfirm}
            loading={loading}
          />
        </View>
      }
    >
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    zIndex: zIndex.modal,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius['2xl'],
    ...shadow.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  closeText: {
    fontSize: 14,
    color: colors.neutral[500],
    fontFamily: 'Inter_500Medium',
  },
  body: { flexShrink: 1 },
  bodyContent: { padding: spacing[6] },
  footer: {
    padding: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  confirmFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[3],
  },
});
