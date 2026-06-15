import { View, ScrollView, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, fontFamily, fontSize } from '@ody/shared';
import { Typography } from '@/components/ui/Typography';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({ title, subtitle, actions, children }: PageLayoutProps) {
  return (
    <View style={styles.page}>
      {/* Page header */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Typography variant="heading1">{title}</Typography>
          {subtitle && (
            <Typography variant="body" color="secondary" style={styles.subtitle}>
              {subtitle}
            </Typography>
          )}
        </View>
        {actions && <View style={styles.actions}>{actions}</View>}
      </View>

      {/* Page content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

interface SectionProps extends ViewProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Section({ title, description, children, style, ...props }: SectionProps) {
  return (
    <View style={[styles.section, style]} {...props}>
      {(title || description) && (
        <View style={styles.sectionHeader}>
          {title && <Typography variant="heading4">{title}</Typography>}
          {description && (
            <Typography variant="body" color="secondary">
              {description}
            </Typography>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

export function Grid({
  children,
  cols = 3,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}) {
  const colGap = spacing[4];
  return (
    <View style={[styles.grid, { gap: colGap }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  titleGroup: { flex: 1, marginRight: spacing[4] },
  subtitle: { marginTop: spacing[1] },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flexShrink: 0,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing[6],
    gap: spacing[6],
  },
  section: { gap: spacing[4] },
  sectionHeader: { gap: spacing[1] },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
