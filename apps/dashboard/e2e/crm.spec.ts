import { test, expect } from '@playwright/test';
import { setupApiMocks } from './support/mocks';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/crm');
});

test('shows all customers in the list', async ({ page }) => {
  await expect(page.getByText('Alice Johnson')).toBeVisible();
  await expect(page.getByText('Bob Smith')).toBeVisible();
  await expect(page.getByText('Charlie Brown')).toBeVisible();
});

test('shows customer emails', async ({ page }) => {
  await expect(page.getByText('alice@example.com')).toBeVisible();
  await expect(page.getByText('bob@example.com')).toBeVisible();
});

test('search filters customer list by name', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Search by name or email…');
  await expect(searchInput).toBeVisible();

  await searchInput.fill('alice');

  // Alice should remain visible
  await expect(page.getByText('Alice Johnson')).toBeVisible();
  // Bob and Charlie should be hidden
  await expect(page.getByText('Bob Smith')).not.toBeVisible();
  await expect(page.getByText('Charlie Brown')).not.toBeVisible();
});

test('search filters customer list by email', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Search by name or email…');
  await searchInput.fill('bob@example');

  await expect(page.getByText('Bob Smith')).toBeVisible();
  await expect(page.getByText('Alice Johnson')).not.toBeVisible();
});

test('clearing search restores full list', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Search by name or email…');
  await searchInput.fill('alice');
  await expect(page.getByText('Bob Smith')).not.toBeVisible();

  await searchInput.clear();

  await expect(page.getByText('Alice Johnson')).toBeVisible();
  await expect(page.getByText('Bob Smith')).toBeVisible();
  await expect(page.getByText('Charlie Brown')).toBeVisible();
});

test('shows no-results message for unmatched search', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Search by name or email…');
  await searchInput.fill('zzz-no-match-zzz');

  await expect(page.getByText('No results')).toBeVisible();
});

test('subtitle updates with filtered count while searching', async ({ page }) => {
  const searchInput = page.getByPlaceholder('Search by name or email…');
  await searchInput.fill('alice');

  // The subtitle changes to "1 of 3 customers"
  await expect(page.getByText(/1 of 3 customers/)).toBeVisible();
});

test('Add Customer button is visible', async ({ page }) => {
  await expect(page.getByText('Add Customer')).toBeVisible();
});
