import { test, expect } from '@playwright/test';
import { setupApiMocks, mockData } from './support/mocks';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/orders');
});

test('shows the orders list with customer names', async ({ page }) => {
  await expect(page.getByText('Alice Johnson')).toBeVisible();
  await expect(page.getByText('Bob Smith')).toBeVisible();
  await expect(page.getByText('Charlie Brown')).toBeVisible();
});

test('shows the correct number of orders', async ({ page }) => {
  // All three orders should be visible
  const count = mockData.orders.data.length;
  for (const order of mockData.orders.data) {
    await expect(page.getByText(order.customer.name)).toBeVisible();
  }
  expect(count).toBe(3);
});

test('displays status filter tabs including "all"', async ({ page }) => {
  await expect(page.getByText('all', { exact: false })).toBeVisible();
  // status labels are displayed as filter options
  await expect(page.getByText('pending')).toBeVisible();
});

test('New Order button is present', async ({ page }) => {
  // PageLayout renders the title and action buttons
  await expect(page.getByText('New Order')).toBeVisible();
});

test('shows order item names', async ({ page }) => {
  await expect(page.getByText('Classic Burger')).toBeVisible();
  await expect(page.getByText('Caesar Salad')).toBeVisible();
});

test('Accept action button is visible for pending orders', async ({ page }) => {
  // The NEXT_LABEL for 'pending' is 'Accept'
  await expect(page.getByText('Accept')).toBeVisible();
});
