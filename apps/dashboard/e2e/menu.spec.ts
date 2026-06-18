import { test, expect } from '@playwright/test';
import { setupApiMocks } from './support/mocks';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/menu');
});

test('shows menu category tabs', async ({ page }) => {
  await expect(page.getByText('Burgers')).toBeVisible();
  await expect(page.getByText('Salads')).toBeVisible();
});

test('shows menu items with names', async ({ page }) => {
  await expect(page.getByText('Classic Burger')).toBeVisible();
  await expect(page.getByText('Caesar Salad')).toBeVisible();
});

test('Add Item button is present', async ({ page }) => {
  await expect(page.getByText('Add Item')).toBeVisible();
});

test('Reorder toggle is present', async ({ page }) => {
  await expect(page.getByText('Reorder')).toBeVisible();
});

test('menu items show prices', async ({ page }) => {
  // Classic Burger at $12.00
  await expect(page.getByText('$12.00')).toBeVisible();
});
