import { useState, useRef } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Switch, useWindowDimensions } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors, spacing, formatCurrency } from '@ody/shared';
import {
  useGetMenuCategories,
  useGetMenuItems,
  usePostMenuCategories,
  usePostMenuItems,
  usePutMenuItemsId,
  useDeleteMenuItemsId,
  usePatchMenuItemsReorder,
  getGetMenuCategoriesQueryKey,
  getGetMenuItemsQueryKey,
} from '@ody/api-client';

type DragViewProps = React.ComponentProps<typeof View> & {
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
};
const DragView = View as React.ComponentType<DragViewProps>;
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import type { MenuCategory, MenuItem } from '@/lib/types';

type MenuItemWithCategory = MenuItem & { category: MenuCategory };

export default function MenuPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MenuItemWithCategory | null>(null);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [deleteItem, setDeleteItem] = useState<MenuItemWithCategory | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedItems, setOrderedItems] = useState<MenuItemWithCategory[]>([]);
  const draggedId = useRef<string | null>(null);

  const { data: catsResponse, isLoading: catsLoading } = useGetMenuCategories();
  const categories = catsResponse?.data ?? [];

  const { data: itemsResponse, isLoading: itemsLoading } = useGetMenuItems(
    activeCategoryId ? { categoryId: activeCategoryId } : undefined,
  );
  const items = (itemsResponse?.data ?? []) as MenuItemWithCategory[];

  const toggleAvailability = usePutMenuItemsId({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetMenuItemsQueryKey() }),
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  const deleteMenuItem = useDeleteMenuItemsId({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMenuItemsQueryKey() });
        setDeleteItem(null);
        toast('Item deleted', 'success');
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  const reorderMutation = usePatchMenuItemsReorder({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMenuItemsQueryKey() });
        toast('Order saved', 'success');
      },
      onError: (err: Error) => toast(err.message, 'error'),
    },
  });

  function enterReorderMode() {
    setOrderedItems([...items]);
    setReorderMode(true);
  }

  function exitReorderMode() {
    setReorderMode(false);
    setOrderedItems([]);
  }

  function handleDragStart(id: string) {
    draggedId.current = id;
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId.current || draggedId.current === targetId) return;
    const fromIdx = orderedItems.findIndex((i) => i.id === draggedId.current);
    const toIdx = orderedItems.findIndex((i) => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...orderedItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setOrderedItems(next);
  }

  function handleDragEnd() {
    if (!draggedId.current) return;
    draggedId.current = null;
    reorderMutation.mutate({
      data: orderedItems.map((item, idx) => ({ id: item.id, sortOrder: idx })),
    });
  }

  const displayItems = reorderMode ? orderedItems : items;

  return (
    <PageLayout
      title="Menu"
      subtitle={`${items.length} items`}
      actions={
        <View style={isMobile ? styles.mobileActions : styles.desktopActions}>
          {reorderMode ? (
            <Button label="Done" variant="secondary" onPress={exitReorderMode} />
          ) : (
            <>
              <Button
                label="Reorder"
                variant="secondary"
                onPress={enterReorderMode}
              />
              <Button label="Add Category" variant="secondary" onPress={() => setShowCreateCategory(true)} />
              <Button label="Add Item" onPress={() => setShowCreateItem(true)} />
            </>
          )}
        </View>
      }
    >
      {/* Mobile: horizontal category tab strip replaces the sidebar */}
      {isMobile && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mobileCatScroll}
          contentContainerStyle={styles.mobileCatContent}
        >
          <Pressable
            style={[styles.mobileCatPill, activeCategoryId === null && styles.mobileCatPillActive]}
            onPress={() => { setActiveCategoryId(null); exitReorderMode(); }}
          >
            <Typography
              variant="label"
              style={activeCategoryId === null ? { color: colors.brand[700] } : { color: colors.neutral[600] }}
            >
              All Items
            </Typography>
          </Pressable>
          {catsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={styles.mobileCatPill}>
                  <Skeleton width={60} height={14} />
                </View>
              ))
            : categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[styles.mobileCatPill, activeCategoryId === cat.id && styles.mobileCatPillActive]}
                  onPress={() => { setActiveCategoryId(cat.id); exitReorderMode(); }}
                >
                  <Typography
                    variant="label"
                    style={activeCategoryId === cat.id ? { color: colors.brand[700] } : { color: colors.neutral[600] }}
                  >
                    {cat.name}{!cat.isActive ? ' (Hidden)' : ''}
                  </Typography>
                </Pressable>
              ))}
        </ScrollView>
      )}

      <View style={[styles.layout, isMobile && styles.layoutMobile]}>
        {/* Desktop only: category sidebar */}
        {!isMobile && (
          <Card style={styles.categorySidebar} padding="none">
            <View style={styles.catHeader}>
              <Typography variant="heading4">Categories</Typography>
            </View>
            <Pressable
              style={[styles.catItem, activeCategoryId === null && styles.catItemActive]}
              onPress={() => { setActiveCategoryId(null); exitReorderMode(); }}
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
              : categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={({ hovered }: { hovered?: boolean }) => [
                      styles.catItem,
                      activeCategoryId === cat.id && styles.catItemActive,
                      !activeCategoryId && hovered && { backgroundColor: colors.neutral[50] },
                    ]}
                    onPress={() => { setActiveCategoryId(cat.id); exitReorderMode(); }}
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
        )}

        {/* Items grid / reorder list */}
        {reorderMode ? (
          <Card style={{ flex: 1 }} padding="none">
            <View style={styles.reorderHeader}>
              <Typography variant="label" color="secondary">
                Drag items to reorder — changes are saved automatically
              </Typography>
            </View>
            {displayItems.map((item) => (
              <DragView
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                style={styles.reorderRow}
              >
                <Typography style={styles.dragHandle}>☰</Typography>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyMedium">{item.name}</Typography>
                  <Typography variant="caption" color="secondary">{item.category.name}</Typography>
                </View>
                <Typography variant="bodySemiBold" color="brand">
                  {formatCurrency(item.priceCents)}
                </Typography>
              </DragView>
            ))}
          </Card>
        ) : (
          <View style={[styles.itemsGrid, isMobile && styles.itemsGridMobile]}>
            {itemsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} style={isMobile ? styles.itemCardMobile : undefined}>
                    <Skeleton height={16} width="60%" />
                    <View style={{ height: 8 }} />
                    <Skeleton height={12} width="90%" />
                    <View style={{ height: 12 }} />
                    <Skeleton height={20} width="30%" />
                  </Card>
                ))
              : displayItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    isMobile={isMobile}
                    onEdit={() => setEditItem(item)}
                    onToggle={(v) => toggleAvailability.mutate({ id: item.id, data: { isAvailable: v } })}
                    onDelete={() => setDeleteItem(item)}
                  />
                ))}

            {!itemsLoading && displayItems.length === 0 && (
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
        )}
      </View>

      {/* Create / Edit modals */}
      <MenuItemModal
        visible={showCreateItem || !!editItem}
        item={editItem}
        categories={categories}
        defaultCategoryId={activeCategoryId ?? undefined}
        onClose={() => { setShowCreateItem(false); setEditItem(null); }}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: getGetMenuItemsQueryKey() });
          setShowCreateItem(false);
          setEditItem(null);
          toast(editItem ? 'Item updated' : 'Item created', 'success');
        }}
      />

      <CreateCategoryModal
        visible={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: getGetMenuCategoriesQueryKey() });
          setShowCreateCategory(false);
          toast('Category created', 'success');
        }}
      />

      <ConfirmModal
        visible={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteMenuItem.mutate({ id: deleteItem.id })}
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
  isMobile,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItemWithCategory;
  isMobile: boolean;
  onEdit: () => void;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <Card style={[styles.itemCard, isMobile && styles.itemCardMobile, !item.isAvailable && styles.itemCardUnavailable]}>
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

  const createItem = usePostMenuItems({
    mutation: { onSuccess: onSaved, onError: (err: Error) => toast(err.message, 'error') },
  });
  const updateItem = usePutMenuItemsId({
    mutation: { onSuccess: onSaved, onError: (err: Error) => toast(err.message, 'error') },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) e.price = 'Valid price required';
    if (!catId) e.catId = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const priceCents = Math.round(parseFloat(price) * 100);
    const body = {
      name,
      description: desc || undefined,
      priceCents,
      categoryId: catId,
      prepTimeMinutes: parseInt(prep, 10) || 15,
    };
    if (item) {
      updateItem.mutate({ id: item.id, data: body });
    } else {
      createItem.mutate({ data: body });
    }
  }

  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={item ? 'Edit Item' : 'New Menu Item'}
      width={500}
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          <Button label={item ? 'Save Changes' : 'Create Item'} onPress={handleSave} loading={isSaving} />
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

  const create = usePostMenuCategories({
    mutation: {
      onSuccess: () => { setName(''); setDesc(''); onSaved(); },
      onError: (err: Error) => toast(err.message, 'error'),
    },
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
            create.mutate({ data: { name, description: desc || undefined } });
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
  layoutMobile: {
    flexDirection: 'column',
  },
  desktopActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  mobileActions: {
    flexDirection: 'column',
    gap: spacing[2],
    alignItems: 'flex-end',
  },
  mobileCatScroll: {
    flexShrink: 0,
  },
  mobileCatContent: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  mobileCatPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 99,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  mobileCatPillActive: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[600],
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
  itemsGridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  itemCard: {
    width: '30%',
    minWidth: 200,
    flex: 1,
  },
  itemCardMobile: {
    width: '100%',
    minWidth: 0,
    flex: 0,
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
  reorderHeader: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
    gap: spacing[3],
  },
  dragHandle: {
    fontSize: 18,
    color: colors.neutral[400],
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
