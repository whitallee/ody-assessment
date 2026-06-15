import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, formatCurrency } from '@ody/shared';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { api, type MenuCategory, type MenuItemWithCategory } from '@/lib/api';

export default function MenuPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MenuItemWithCategory | null>(null);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [deleteItem, setDeleteItem] = useState<MenuItemWithCategory | null>(null);

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: api.menuCategories.list,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', activeCategoryId],
    queryFn: () => api.menuItems.list(activeCategoryId ? { categoryId: activeCategoryId } : undefined),
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.menuItems.update(id, { isAvailable }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const deleteMenuItem = useMutation({
    mutationFn: (id: string) => api.menuItems.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      setDeleteItem(null);
      toast('Item deleted', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <PageLayout
      title="Menu"
      subtitle={`${items?.length ?? 0} items`}
      actions={
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <Button label="Add Category" variant="secondary" onPress={() => setShowCreateCategory(true)} />
          <Button label="Add Item" onPress={() => setShowCreateItem(true)} />
        </View>
      }
    >
      <View style={styles.layout}>
        {/* Category sidebar */}
        <Card style={styles.categorySidebar} padding="none">
          <View style={styles.catHeader}>
            <Typography variant="heading4">Categories</Typography>
          </View>
          <Pressable
            style={[styles.catItem, activeCategoryId === null && styles.catItemActive]}
            onPress={() => setActiveCategoryId(null)}
          >
            <Typography
              variant={activeCategoryId === null ? 'bodySemiBold' : 'body'}
              style={activeCategoryId === null ? { color: colors.brand[700] } : { color: colors.neutral[700] }}
            >
              All Items
            </Typography>
          </Pressable>
          {catsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={styles.catItem}>
                  <Skeleton width="80%" height={14} />
                </View>
              ))
            : categories?.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={({ hovered }: { hovered?: boolean }) => [
                    styles.catItem,
                    activeCategoryId === cat.id && styles.catItemActive,
                    !activeCategoryId && hovered && { backgroundColor: colors.neutral[50] },
                  ]}
                  onPress={() => setActiveCategoryId(cat.id)}
                >
                  <Typography
                    variant={activeCategoryId === cat.id ? 'bodySemiBold' : 'body'}
                    style={
                      activeCategoryId === cat.id
                        ? { color: colors.brand[700] }
                        : { color: colors.neutral[700] }
                    }
                  >
                    {cat.name}
                  </Typography>
                  {!cat.isActive && (
                    <Badge label="Hidden" variant="default" size="sm" />
                  )}
                </Pressable>
              ))}
        </Card>

        {/* Items grid */}
        <View style={styles.itemsGrid}>
          {itemsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton height={16} width="60%" />
                  <View style={{ height: 8 }} />
                  <Skeleton height={12} width="90%" />
                  <View style={{ height: 12 }} />
                  <Skeleton height={20} width="30%" />
                </Card>
              ))
            : items?.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditItem(item)}
                  onToggle={(v) => toggleAvailability.mutate({ id: item.id, isAvailable: v })}
                  onDelete={() => setDeleteItem(item)}
                />
              ))}

          {!itemsLoading && items?.length === 0 && (
            <View style={styles.empty}>
              <Typography variant="heading4" color="secondary">No items</Typography>
              <Typography variant="body" color="tertiary">
                Add your first menu item to get started.
              </Typography>
              <View style={{ marginTop: 8 }}>
                <Button label="Add Item" onPress={() => setShowCreateItem(true)} />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Create / Edit modals */}
      <MenuItemModal
        visible={showCreateItem || !!editItem}
        item={editItem}
        categories={categories ?? []}
        defaultCategoryId={activeCategoryId ?? undefined}
        onClose={() => { setShowCreateItem(false); setEditItem(null); }}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['menu-items'] });
          setShowCreateItem(false);
          setEditItem(null);
          toast(editItem ? 'Item updated' : 'Item created', 'success');
        }}
      />

      <CreateCategoryModal
        visible={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['menu-categories'] });
          setShowCreateCategory(false);
          toast('Category created', 'success');
        }}
      />

      <ConfirmModal
        visible={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMenuItem.mutate(deleteItem.id)}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteMenuItem.isPending}
      />
    </PageLayout>
  );
}

function MenuItemCard({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItemWithCategory;
  onEdit: () => void;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <Card style={[styles.itemCard, !item.isAvailable && styles.itemCardUnavailable]}>
      <View style={styles.itemCardHeader}>
        <Badge label={item.category.name} size="sm" variant="default" />
        <View style={styles.itemCardActions}>
          <Switch
            value={item.isAvailable}
            onValueChange={onToggle}
            thumbColor={item.isAvailable ? colors.brand[500] : colors.neutral[300]}
            trackColor={{ true: colors.brand[200], false: colors.neutral[200] }}
          />
        </View>
      </View>
      <Typography variant="bodySemiBold" style={styles.itemName}>{item.name}</Typography>
      {item.description && (
        <Typography variant="caption" color="secondary" numberOfLines={2} style={styles.itemDesc}>
          {item.description}
        </Typography>
      )}
      <View style={styles.itemFooter}>
        <Typography variant="heading4" color="brand">
          {formatCurrency(item.priceCents)}
        </Typography>
        <View style={styles.itemFooterActions}>
          <Button label="Edit" size="sm" variant="ghost" onPress={onEdit} />
          <Button label="Delete" size="sm" variant="ghost" onPress={onDelete} />
        </View>
      </View>
      {item.prepTimeMinutes && (
        <Typography variant="caption" color="secondary" style={styles.prepTime}>
          ⏱ {item.prepTimeMinutes} min prep
        </Typography>
      )}
    </Card>
  );
}

function MenuItemModal({
  visible,
  item,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  item: MenuItemWithCategory | null;
  categories: MenuCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(item?.name ?? '');
  const [desc, setDesc] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item ? String(item.priceCents / 100) : '');
  const [prep, setPrep] = useState(item ? String(item.prepTimeMinutes) : '15');
  const [catId, setCatId] = useState(item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => {
      const priceCents = Math.round(parseFloat(price) * 100);
      const body = {
        name,
        description: desc || undefined,
        priceCents,
        categoryId: catId,
        prepTimeMinutes: parseInt(prep, 10) || 15,
      };
      return item
        ? api.menuItems.update(item.id, body)
        : api.menuItems.create(body);
    },
    onSuccess: onSaved,
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) e.price = 'Valid price required';
    if (!catId) e.catId = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={item ? 'Edit Item' : 'New Menu Item'}
      width={500}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button label={item ? 'Save Changes' : 'Create Item'} onPress={() => { if (validate()) save.mutate(); }} loading={save.isPending} />
        </View>
      }
    >
      <View style={{ gap: spacing[4] }}>
        <Input label="Name *" value={name} onChangeText={setName} error={errors.name} placeholder="Item name" />
        <Input label="Description" value={desc} onChangeText={setDesc} placeholder="Brief description" multiline numberOfLines={2} />
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Input label="Price (USD) *" value={price} onChangeText={setPrice} error={errors.price} placeholder="0.00" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Prep time (min)" value={prep} onChangeText={setPrep} placeholder="15" keyboardType="number-pad" />
          </View>
        </View>
        <View>
          <Typography variant="label" style={{ marginBottom: 8 }}>Category *</Typography>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCatId(cat.id)}
                style={[
                  styles.catPill,
                  catId === cat.id && styles.catPillActive,
                ]}
              >
                <Typography
                  variant="label"
                  style={catId === cat.id ? { color: colors.neutral[0] } : { color: colors.neutral[700] }}
                >
                  {cat.name}
                </Typography>
              </Pressable>
            ))}
          </View>
          {errors.catId && <Typography variant="caption" color="error">{errors.catId}</Typography>}
        </View>
      </View>
    </Modal>
  );
}

function CreateCategoryModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => api.menuCategories.create({ name, description: desc || undefined }),
    onSuccess: () => { setName(''); setDesc(''); onSaved(); },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New Category"
      width={440}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button label="Create Category" onPress={() => {
            if (!name.trim()) { setError('Name is required'); return; }
            create.mutate();
          }} loading={create.isPending} />
        </View>
      }
    >
      <View style={{ gap: spacing[4] }}>
        <Input label="Name *" value={name} onChangeText={setName} error={error} placeholder="e.g. Starters" />
        <Input label="Description" value={desc} onChangeText={setDesc} placeholder="Brief description" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: 'row',
    gap: spacing[5],
    alignItems: 'flex-start',
  },
  categorySidebar: {
    width: 200,
    flexShrink: 0,
  },
  catHeader: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  catItemActive: {
    backgroundColor: colors.brand[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.brand[600],
  },
  itemsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    alignContent: 'flex-start',
  },
  itemCard: {
    width: '30%',
    minWidth: 200,
    flex: 1,
  },
  itemCardUnavailable: {
    opacity: 0.6,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  itemCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  itemName: { marginBottom: spacing[1] },
  itemDesc: { marginBottom: spacing[3] },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  itemFooterActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  prepTime: { marginTop: spacing[2] },
  empty: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  catPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 99,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  catPillActive: {
    backgroundColor: colors.brand[700],
    borderColor: colors.brand[700],
  },
});
