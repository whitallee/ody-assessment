import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { colors, spacing, formatCurrency } from '@ody/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { api, type OrderWithDetails, type MenuItemWithCategory } from '@/lib/api';

interface CreateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (order: OrderWithDetails) => void;
}

interface CartItem {
  menuItem: MenuItemWithCategory;
  quantity: number;
}

export function CreateOrderModal({ visible, onClose, onCreated }: CreateOrderModalProps) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu-items', 'available'],
    queryFn: () => api.menuItems.list({ available: 'true' }),
    enabled: visible,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: () => api.customers.list({ limit: 100 }),
    enabled: visible,
  });

  const createOrder = useMutation({
    mutationFn: () =>
      api.orders.create({
        customerId: selectedCustomerId,
        items: cart.map((c) => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
        notes: notes || undefined,
      }),
    onSuccess: (order) => {
      onCreated(order);
      resetForm();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function resetForm() {
    setCart([]);
    setNotes('');
    setCustomerSearch('');
    setSelectedCustomerId(null);
  }

  function addToCart(item: MenuItemWithCategory) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function updateQty(itemId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.menuItem.id === itemId ? { ...c, quantity: qty } : c)),
      );
    }
  }

  const total = cart.reduce((sum, c) => sum + c.menuItem.priceCents * c.quantity, 0);

  const filteredCustomers = customersData?.data.filter((cu) =>
    cu.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    cu.email?.toLowerCase().includes(customerSearch.toLowerCase()),
  ) ?? [];

  const selectedCustomer = customersData?.data.find((cu) => cu.id === selectedCustomerId);

  // Group items by category
  const byCategory = menuItems?.reduce<Record<string, MenuItemWithCategory[]>>((acc, item) => {
    const cat = item.category.name;
    return { ...acc, [cat]: [...(acc[cat] ?? []), item] };
  }, {}) ?? {};

  return (
    <Modal
      visible={visible}
      onClose={() => { resetForm(); onClose(); }}
      title="New Order"
      width={680}
      footer={
        <View style={styles.footer}>
          <View>
            <Typography variant="caption" color="secondary">
              {cart.length} items
            </Typography>
            <Typography variant="heading4" color="brand">
              {formatCurrency(total)}
            </Typography>
          </View>
          <View style={styles.footerActions}>
            <Button label="Cancel" variant="ghost" onPress={() => { resetForm(); onClose(); }} />
            <Button
              label="Place Order"
              onPress={() => createOrder.mutate()}
              loading={createOrder.isPending}
              disabled={cart.length === 0}
            />
          </View>
        </View>
      }
    >
      <View style={styles.body}>
        {/* Left: menu */}
        <View style={styles.menuCol}>
          <Typography variant="heading4" style={styles.colTitle}>Menu</Typography>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={44} style={{ marginBottom: 8 }} />)
            : Object.entries(byCategory).map(([cat, items]) => (
                <View key={cat} style={styles.category}>
                  <Typography variant="overline" style={styles.categoryLabel}>{cat}</Typography>
                  {items.map((item) => {
                    const inCart = cart.find((c) => c.menuItem.id === item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => addToCart(item)}
                        style={({ hovered }: { hovered?: boolean }) => [
                          styles.menuItem,
                          hovered && styles.menuItemHover,
                          !!inCart && styles.menuItemSelected,
                        ]}
                      >
                        <View style={styles.menuItemInfo}>
                          <Typography variant="bodyMedium">{item.name}</Typography>
                          <Typography variant="caption" color="secondary">
                            {formatCurrency(item.priceCents)}
                          </Typography>
                        </View>
                        {inCart && (
                          <View style={styles.qtyBadge}>
                            <Typography style={styles.qtyText}>{inCart.quantity}</Typography>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
        </View>

        {/* Right: cart + customer */}
        <View style={styles.rightCol}>
          {/* Customer */}
          <View style={styles.section}>
            <Typography variant="heading4" style={styles.colTitle}>Customer</Typography>
            {selectedCustomer ? (
              <View style={styles.selectedCustomer}>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyMedium">{selectedCustomer.name}</Typography>
                  {selectedCustomer.email && (
                    <Typography variant="caption" color="secondary">{selectedCustomer.email}</Typography>
                  )}
                </View>
                <Button label="Change" size="sm" variant="ghost" onPress={() => setSelectedCustomerId(null)} />
              </View>
            ) : (
              <>
                <Input
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                />
                {customerSearch.length > 0 && (
                  <View style={styles.customerDropdown}>
                    {filteredCustomers.slice(0, 5).map((cu) => (
                      <Pressable
                        key={cu.id}
                        onPress={() => { setSelectedCustomerId(cu.id); setCustomerSearch(''); }}
                        style={({ hovered }: { hovered?: boolean }) => [
                          styles.customerOption,
                          hovered && { backgroundColor: colors.neutral[50] },
                        ]}
                      >
                        <Typography variant="bodyMedium">{cu.name}</Typography>
                        {cu.email && <Typography variant="caption" color="secondary">{cu.email}</Typography>}
                      </Pressable>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <Typography variant="caption" color="secondary" style={{ padding: 8 }}>
                        No customers found
                      </Typography>
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Cart */}
          <View style={[styles.section, { flex: 1 }]}>
            <Typography variant="heading4" style={styles.colTitle}>Cart</Typography>
            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Typography variant="body" color="tertiary">
                  Tap items to add them
                </Typography>
              </View>
            ) : (
              <ScrollView>
                {cart.map((c) => (
                  <View key={c.menuItem.id} style={styles.cartRow}>
                    <Typography variant="body" style={{ flex: 1 }} numberOfLines={1}>
                      {c.menuItem.name}
                    </Typography>
                    <View style={styles.qtyControl}>
                      <Pressable
                        onPress={() => updateQty(c.menuItem.id, c.quantity - 1)}
                        style={styles.qtyBtn}
                      >
                        <Typography style={styles.qtyBtnText}>−</Typography>
                      </Pressable>
                      <Typography variant="bodyMedium" style={styles.qtyNum}>
                        {c.quantity}
                      </Typography>
                      <Pressable
                        onPress={() => updateQty(c.menuItem.id, c.quantity + 1)}
                        style={styles.qtyBtn}
                      >
                        <Typography style={styles.qtyBtnText}>+</Typography>
                      </Pressable>
                    </View>
                    <Typography variant="bodySemiBold" style={styles.cartPrice}>
                      {formatCurrency(c.menuItem.priceCents * c.quantity)}
                    </Typography>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Input
              label="Order Notes"
              placeholder="Any special requests..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    gap: spacing[5],
    minHeight: 400,
  },
  menuCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.neutral[100],
    paddingRight: spacing[5],
  },
  rightCol: {
    width: 240,
    gap: spacing[4],
  },
  colTitle: { marginBottom: spacing[3] },
  category: { marginBottom: spacing[4] },
  categoryLabel: { marginBottom: spacing[2] },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2.5],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: spacing[1],
  },
  menuItemHover: { backgroundColor: colors.neutral[50] },
  menuItemSelected: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  menuItemInfo: { flex: 1 },
  qtyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: colors.neutral[0],
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  section: { gap: spacing[2] },
  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  customerDropdown: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    marginTop: 4,
  },
  customerOption: {
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[2],
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    color: colors.neutral[700],
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
  },
  qtyNum: { minWidth: 20, textAlign: 'center' },
  cartPrice: { minWidth: 56, textAlign: 'right' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
});
