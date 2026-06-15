import { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, fontFamily, fontSize } from '@ody/shared';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Typography variant="label" style={styles.label}>
          {label}
        </Typography>
      )}
      <View
        style={[
          styles.inputContainer,
          focused && styles.focused,
          !!error && styles.errored,
          props.editable === false && styles.disabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : undefined, style]}
          placeholderTextColor={colors.neutral[400]}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <Pressable
            style={styles.rightIcon}
            onPress={onRightIconPress}
            hitSlop={8}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>
      {error && (
        <Typography variant="caption" color="error" style={styles.message}>
          {error}
        </Typography>
      )}
      {hint && !error && (
        <Typography variant="caption" color="secondary" style={styles.message}>
          {hint}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1.5] },
  label: { color: colors.neutral[700] },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.md,
    backgroundColor: colors.neutral[0],
    minHeight: 40,
  },
  focused: {
    borderColor: colors.brand[500],
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  errored: { borderColor: colors.error[500] },
  disabled: { backgroundColor: colors.neutral[50] },
  input: {
    flex: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: colors.neutral[900],
    outlineStyle: 'none',
  } as object,
  inputWithLeft: { paddingLeft: spacing[1] },
  leftIcon: { paddingLeft: spacing[3] },
  rightIcon: { paddingRight: spacing[3] },
  message: { marginTop: spacing[0.5] },
});
