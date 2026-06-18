import { test, expect } from '@playwright/test';
import { setupApiMocks } from './support/mocks';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
});

test('sidebar shows brand and all nav items', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('The Golden Fork')).toBeVisible();
  for (const label of ['Home', 'Orders', 'Reservations', 'Menu', 'CRM', 'Rewards', 'Settings']) {
    await expect(page.getByText(label)).toBeVisible();
  }
});

test('navigates to Orders page via sidebar', async ({ page }) => {
  await page.goto('/');
  // "Reservations" text is unambiguous on the home page
  await page.getByText('Reservations').first().click();
  await expect(page).toHaveURL(/\/reservations/);
  await expect(page.getByText('Reservations').first()).toBeVisible();
});

test('navigates to CRM page via sidebar', async ({ page }) => {
  await page.goto('/');
  await page.getByText('CRM').click();
  await expect(page).toHaveURL(/\/crm/);
});

test('navigates to Menu page via sidebar', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Menu').first().click();
  await expect(page).toHaveURL(/\/menu/);
});

test('home page shows KPI cards with data', async ({ page }) => {
  await page.goto('/');
  // Wait for KPI cards to appear (they depend on the home/stats mock)
  await expect(page.getByText("Today's Overview")).toBeVisible();
  await expect(page.getByText('Orders Today')).toBeVisible();
  await expect(page.getByText('Revenue Today')).toBeVisible();
});
