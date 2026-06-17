import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontFamily, fontSize } from '@ody/shared';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, OrderStatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton, SkeletonCard, SkeletonRow } from '@/components/ui/Skeleton';
import { useRouter } from 'expo-router';

export default function UILibraryPage() {
  const router = useRouter();
  const [selectVal, setSelectVal] = useState<string | null>(null);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Button label="← Back" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>

      <Typography variant="display" style={styles.pageTitle}>Design System</Typography>
      <Typography variant="body" color="secondary" style={styles.pageSubtitle}>
        Ody Dashboard component library and token reference
      </Typography>

      {/* ── Color Tokens ───────────────────────────────────────────────────── */}
      <Section title="Color Tokens">
        <Subsection title="Brand (Amber)">
          <View style={styles.swatchRow}>
            {Object.entries(colors.brand).map(([shade, hex]) => (
              <ColorSwatch key={shade} shade={shade} hex={hex} />
            ))}
          </View>
        </Subsection>
        <Subsection title="Neutrals (Warm Gray)">
          <View style={styles.swatchRow}>
            {Object.entries(colors.neutral).map(([shade, hex]) => (
              <ColorSwatch key={shade} shade={shade} hex={hex} />
            ))}
          </View>
        </Subsection>
        <Subsection title="Semantic">
          <View style={styles.swatchRow}>
            <ColorSwatch shade="success" hex={colors.success[500]} />
            <ColorSwatch shade="warning" hex={colors.warning[500]} />
            <ColorSwatch shade="error" hex={colors.error[500]} />
            <ColorSwatch shade="info" hex={colors.info[500]} />
          </View>
        </Subsection>
      </Section>

      {/* ── Typography ─────────────────────────────────────────────────────── */}
      <Section title="Typography">
        <Typography variant="display">Display — Playfair Display 36px</Typography>
        <Typography variant="heading1">Heading 1 — Playfair Display 30px</Typography>
        <Typography variant="heading2">Heading 2 — Playfair Display 24px</Typography>
        <Typography variant="heading3">Heading 3 — Inter SemiBold 20px</Typography>
        <Typography variant="heading4">Heading 4 — Inter SemiBold 18px</Typography>
        <Typography variant="body">Body — Inter Regular 15px. The quick brown fox jumps over the lazy dog.</Typography>
        <Typography variant="bodyMedium">Body Medium — Inter 500 15px</Typography>
        <Typography variant="bodySemiBold">Body SemiBold — Inter 600 15px</Typography>
        <Typography variant="bodyBold">Body Bold — Inter 700 15px</Typography>
        <Typography variant="caption">Caption — Inter Regular 13px. Used for secondary info.</Typography>
        <Typography variant="label">Label — Inter Medium 13px. Used for form labels.</Typography>
        <Typography variant="overline">OVERLINE — INTER 600 11px. USED FOR SECTION HEADERS.</Typography>
      </Section>

      {/* ── Spacing Scale ──────────────────────────────────────────────────── */}
      <Section title="Spacing Scale">
        <View style={styles.spacingGrid}>
          {Object.entries(spacing).map(([key, val]) => (
            <View key={key} style={styles.spacingItem}>
              <View style={[styles.spacingBar, { width: typeof val === 'number' ? Math.min(val * 2, 120) : 0 }]} />
              <Typography variant="caption">{key} = {val}px</Typography>
            </View>
          ))}
        </View>
      </Section>

      {/* ── Surfaces ───────────────────────────────────────────────────────── */}
      <Section title="Surfaces">
        <View style={styles.row}>
          <Card style={styles.flex}>
            <Typography variant="overline">Card (default)</Typography>
            <Typography variant="body" color="secondary">Subtle border, small shadow</Typography>
          </Card>
          <Card variant="elevated" style={styles.flex}>
            <Typography variant="overline">Card (elevated)</Typography>
            <Typography variant="body" color="secondary">More prominent shadow</Typography>
          </Card>
          <Card variant="flat" style={styles.flex}>
            <Typography variant="overline">Card (flat)</Typography>
            <Typography variant="body" color="secondary">Border only, no shadow</Typography>
          </Card>
        </View>
      </Section>

      {/* ── Buttons ────────────────────────────────────────────────────────── */}
      <Section title="Buttons">
        <Subsection title="Variants">
          <View style={styles.row}>
            <Button label="Primary" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Outline" variant="outline" />
            <Button label="Ghost" variant="ghost" />
            <Button label="Danger" variant="danger" />
          </View>
        </Subsection>
        <Subsection title="Sizes">
          <View style={styles.row}>
            <Button label="Small" size="sm" />
            <Button label="Medium" size="md" />
            <Button label="Large" size="lg" />
          </View>
        </Subsection>
        <Subsection title="States">
          <View style={styles.row}>
            <Button label="Loading" loading />
            <Button label="Disabled" disabled />
          </View>
        </Subsection>
      </Section>

      {/* ── Badges ─────────────────────────────────────────────────────────── */}
      <Section title="Badges & Status">
        <Subsection title="Badge variants">
          <View style={styles.row}>
            <Badge label="Default" variant="default" />
            <Badge label="Success" variant="success" dot />
            <Badge label="Warning" variant="warning" dot />
            <Badge label="Error" variant="error" dot />
            <Badge label="Info" variant="info" dot />
            <Badge label="Brand" variant="brand" dot />
          </View>
        </Subsection>
        <Subsection title="Order statuses">
          <View style={styles.row}>
            <OrderStatusBadge status="pending" />
            <OrderStatusBadge status="accepted" />
            <OrderStatusBadge status="preparing" />
            <OrderStatusBadge status="ready" />
            <OrderStatusBadge status="completed" />
            <OrderStatusBadge status="cancelled" />
          </View>
        </Subsection>
      </Section>

      {/* ── Inputs ─────────────────────────────────────────────────────────── */}
      <Section title="Form Controls">
        <View style={{ maxWidth: 480, gap: spacing[4] }}>
          <Input label="Default" placeholder="Placeholder text" />
          <Input label="With hint" placeholder="Enter value" hint="This is a helpful hint." />
          <Input label="Error state" defaultValue="invalid@" error="Please enter a valid email address." />
          <Input label="Disabled" value="Cannot edit this" editable={false} />
        </View>
      </Section>

      {/* ── Select ─────────────────────────────────────────────────────────── */}
      <Section title="Select / Dropdown">
        <View style={{ maxWidth: 480, gap: spacing[4] }}>
          <Select
            label="Default"
            value={selectVal}
            onChange={setSelectVal}
            placeholder="Choose an option…"
            options={[
              { value: 'pending', label: 'Pending', description: 'Awaiting confirmation' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'ready', label: 'Ready for pickup' },
              { value: 'completed', label: 'Completed' },
            ]}
            hint="Current value displayed after selection"
          />
          <Select
            label="With error"
            value={null}
            onChange={() => {}}
            options={[{ value: 'a', label: 'Option A' }]}
            error="This field is required"
          />
          <Select
            label="Disabled"
            value="accepted"
            onChange={() => {}}
            options={[{ value: 'accepted', label: 'Accepted' }]}
            disabled
          />
        </View>
      </Section>

      {/* ── Loading States ─────────────────────────────────────────────────── */}
      <Section title="Loading / Skeleton States">
        <View style={styles.row}>
          <View style={styles.flex}>
            <Typography variant="label" style={{ marginBottom: 12 }}>Skeleton Card</Typography>
            <SkeletonCard />
          </View>
          <View style={styles.flex}>
            <Typography variant="label" style={{ marginBottom: 12 }}>Skeleton Rows</Typography>
            <Card padding="sm">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </Card>
          </View>
        </View>
      </Section>

      {/* ── Radius & Border ────────────────────────────────────────────────── */}
      <Section title="Border Radius">
        <View style={styles.row}>
          {Object.entries(radius)
            .filter(([k]) => k !== 'full')
            .map(([key, val]) => (
              <View key={key} style={styles.radiusItem}>
                <View style={[styles.radiusBox, { borderRadius: val }]} />
                <Typography variant="caption">{key} / {val}px</Typography>
              </View>
            ))}
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Typography variant="heading2" style={styles.sectionTitle}>{title}</Typography>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.subsection}>
      <Typography variant="overline" style={styles.subsectionTitle}>{title}</Typography>
      {children}
    </View>
  );
}

function ColorSwatch({ shade, hex }: { shade: string; hex: string }) {
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchBox, { backgroundColor: hex }]} />
      <Typography variant="caption">{shade}</Typography>
      <Typography style={styles.swatchHex}>{hex}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing[8], gap: spacing[10], maxWidth: 1100, alignSelf: 'center', width: '100%' },
  topBar: { marginBottom: spacing[2] },
  pageTitle: { marginBottom: spacing[2] },
  pageSubtitle: { marginBottom: spacing[4] },
  section: { gap: spacing[5] },
  sectionTitle: {
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    marginBottom: spacing[2],
  },
  sectionContent: { gap: spacing[5] },
  subsection: { gap: spacing[3] },
  subsectionTitle: { marginBottom: spacing[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], alignItems: 'flex-start' },
  flex: { flex: 1, minWidth: 200 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  swatch: { alignItems: 'center', gap: spacing[1] },
  swatchBox: { width: 52, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.neutral[200] },
  swatchHex: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.neutral[400] },
  spacingGrid: { gap: spacing[2] },
  spacingItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  spacingBar: { height: 16, backgroundColor: colors.brand[400], borderRadius: 2 },
  radiusItem: { alignItems: 'center', gap: spacing[2] },
  radiusBox: { width: 48, height: 48, backgroundColor: colors.neutral[200], borderWidth: 2, borderColor: colors.neutral[400] },
});
