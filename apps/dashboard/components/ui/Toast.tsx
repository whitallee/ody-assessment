import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { colors, radius, shadow, spacing, zIndex } from '@ody/shared';
import { Typography } from './Typography';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(3400),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [opacity]);

  const typeConfig = {
    success: { bg: colors.success[700], icon: '✓' },
    error: { bg: colors.error[600], icon: '✕' },
    warning: { bg: colors.warning[600], icon: '⚠' },
    info: { bg: colors.neutral[800], icon: 'ℹ' },
  };

  const { bg, icon } = typeConfig[toast.type];

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
      <Typography style={styles.icon}>{icon}</Typography>
      <Typography style={styles.message}>{toast.message}</Typography>
    </Animated.View>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[6],
    gap: spacing[2],
    zIndex: zIndex.toast,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'none' } as object) : {}),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    maxWidth: 360,
    ...shadow.lg,
  },
  icon: {
    color: colors.neutral[0],
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  message: {
    color: colors.neutral[0],
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    flex: 1,
  },
});
