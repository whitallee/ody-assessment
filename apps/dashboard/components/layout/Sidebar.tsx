import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors, fontFamily, fontSize, spacing, radius } from '@ody/shared';
import { Typography } from '@/components/ui/Typography';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: '⌂' },
  { label: 'Orders', href: '/orders', icon: '📋' },
  { label: 'Reservations', href: '/reservations', icon: '📅' },
  { label: 'Menu', href: '/menu', icon: '🍽' },
  { label: 'CRM', href: '/crm', icon: '👥' },
  { label: 'Rewards', href: '/rewards', icon: '🎁' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <Typography style={styles.brandName}>The Golden Fork</Typography>
        <Typography style={styles.brandSub}>Dashboard</Typography>
      </View>

      {/* Navigation */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as never)}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                !isActive && hovered && styles.navItemHover,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Typography style={[styles.navIcon, isActive && styles.navIconActive]}>
                {item.icon}
              </Typography>
              <Typography
                style={[styles.navLabel, isActive && styles.navLabelActive]}
              >
                {item.label}
              </Typography>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* UI Library link */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/ui-library' as never)}
          style={({ hovered }: { hovered?: boolean }) => [
            styles.footerLink,
            hovered && styles.footerLinkHover,
          ]}
        >
          <Typography style={styles.footerLinkText}>Design System</Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.neutral[950],
    borderRightWidth: 1,
    borderRightColor: colors.neutral[800],
    flexDirection: 'column',
    height: '100%',
  },
  brand: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[800],
  },
  brandName: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.lg,
    color: colors.neutral[0],
    lineHeight: fontSize.lg * 1.2,
  },
  brandSub: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  nav: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    borderRadius: radius.lg,
    marginBottom: spacing[0.5],
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: colors.neutral[800],
  },
  navItemHover: {
    backgroundColor: colors.neutral[900],
  },
  navIcon: {
    fontSize: 16,
    marginRight: spacing[3],
    color: colors.neutral[500],
    width: 20,
    textAlign: 'center',
  },
  navIconActive: {
    color: colors.brand[400],
  },
  navLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    flex: 1,
  },
  navLabelActive: {
    color: colors.neutral[0],
    fontFamily: fontFamily.bodySemiBold,
  },
  activeIndicator: {
    width: 3,
    height: 16,
    backgroundColor: colors.brand[400],
    borderRadius: radius.full,
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -8,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
  },
  footerLink: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
  },
  footerLinkHover: {
    backgroundColor: colors.neutral[900],
  },
  footerLinkText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
