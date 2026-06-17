import { useState, useRef } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing, shadow } from '@ody/shared';
import { Typography } from './Typography';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
  description?: string;
}

interface SelectProps<T extends string = string> {
  label?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export function Select<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  hint,
  error,
  disabled = false,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View>(null);

  const selected = options.find((o) => o.value === value);

  function handleOpen() {
    if (disabled) return;
    triggerRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setTriggerLayout({ x: pageX, y: pageY, width, height });
      setOpen(true);
    });
  }

  return (
    <View style={styles.wrapper}>
      {label && (
        <Typography variant="label" style={[styles.label, !!error && styles.labelError]}>
          {label}
        </Typography>
      )}

      <Pressable
        ref={triggerRef}
        onPress={handleOpen}
        disabled={disabled}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.trigger,
          !!error && styles.triggerError,
          disabled && styles.triggerDisabled,
          !disabled && hovered && styles.triggerHover,
          pressed && styles.triggerPressed,
          open && styles.triggerOpen,
        ]}
      >
        <Typography
          style={[
            styles.triggerText,
            !selected && styles.placeholderText,
            disabled && styles.triggerTextDisabled,
          ]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Typography>
        <Typography style={[styles.chevron, open && styles.chevronOpen]}>▾</Typography>
      </Pressable>

      {hint && !error && (
        <Typography variant="caption" color="secondary" style={styles.hint}>{hint}</Typography>
      )}
      {error && (
        <Typography style={styles.errorText}>{error}</Typography>
      )}

      {/* Dropdown overlay */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <View
          style={[
            styles.dropdown,
            {
              top: triggerLayout.y + triggerLayout.height + 4,
              left: triggerLayout.x,
              width: triggerLayout.width,
            },
          ]}
        >
          <ScrollView
            style={{ maxHeight: 240 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={({ hovered }: { hovered?: boolean }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    !isSelected && hovered && styles.optionHover,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Typography
                      style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                    >
                      {opt.label}
                    </Typography>
                    {opt.description && (
                      <Typography variant="caption" color="secondary">{opt.description}</Typography>
                    )}
                  </View>
                  {isSelected && (
                    <Typography style={styles.checkmark}>✓</Typography>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1.5] },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.neutral[700],
  },
  labelError: { color: colors.error[600] },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[0],
  },
  triggerHover: { borderColor: colors.neutral[300] },
  triggerPressed: { backgroundColor: colors.neutral[50] },
  triggerOpen: { borderColor: colors.brand[400], ...shadow.sm },
  triggerError: { borderColor: colors.error[500] },
  triggerDisabled: { backgroundColor: colors.neutral[50], borderColor: colors.neutral[200] },
  triggerText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
  },
  placeholderText: { color: colors.neutral[400] },
  triggerTextDisabled: { color: colors.neutral[400] },
  chevron: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.neutral[400],
    lineHeight: 18,
  },
  chevronOpen: { color: colors.brand[500] },
  hint: { marginTop: 2 },
  errorText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.error[600],
    marginTop: 2,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadow.lg,
    zIndex: 9999,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  optionHover: { backgroundColor: colors.neutral[50] },
  optionSelected: { backgroundColor: colors.brand[50] },
  optionLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.neutral[800],
  },
  optionLabelSelected: {
    fontFamily: fontFamily.bodySemiBold,
    color: colors.brand[700],
  },
  checkmark: {
    fontSize: 13,
    color: colors.brand[500],
    fontFamily: fontFamily.bodySemiBold,
  },
});
