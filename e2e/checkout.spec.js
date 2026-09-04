import { expect, test } from "@playwright/test";

const productCard = (page, name) =>
  page.getByRole("heading", { name }).locator("..").locator("..");

async function addProduct(page, name) {
  await productCard(page, name).getByRole("button", { name: "Add to Cart" }).click();
}

async function signUp(page) {
  await page.getByRole("link", { name: "login" }).click();
  await page.getByRole("button", { name: "Sign Up" }).click();
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("secret12");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page).toHaveURL("/");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("blocks unauthenticated checkout while preserving the cart through sign-up", async ({
  page,
}) => {
  await addProduct(page, "Wireless Headphones");
  await page.getByRole("link", { name: "Shopping Cart" }).click();

  await expect(page.getByText("Please login to proceed with checkout.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Checkout" })).toHaveCount(0);

  await signUp(page);
  await page.getByRole("link", { name: "Shopping Cart" }).click();
  await expect(page.getByRole("heading", { name: "Total Items: 1" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Checkout" })).toBeVisible();
});

test("validates required checkout fields and rejects invalid field boundaries", async ({
  page,
}) => {
  await addProduct(page, "Bluetooth Speaker");
  await page.getByRole("link", { name: "Shopping Cart" }).click();
  await signUp(page);
  await page.getByRole("link", { name: "Shopping Cart" }).click();
  await page.getByRole("link", { name: "Checkout" }).click();

  await page.getByLabel("Name").fill("");
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page.getByText("Name is required")).toBeVisible();
  await expect(page.getByText("Address is required")).toBeVisible();
  await expect(page.getByText("Phone is required")).toBeVisible();

  await page.getByLabel("Name").fill("A");
  await page.getByLabel("Address").fill("A");
  await page.getByLabel("Phone").fill("12345");
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
  await expect(page.getByText("Address must be at least 2 characters")).toBeVisible();
  await expect(
    page.getByText("Please enter a valid 10-digit phone number"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
});

test("places an order with updated quantities, discounted total, and a cleared cart", async ({
  page,
}) => {
  await addProduct(page, "Wireless Headphones");
  await addProduct(page, "Bluetooth Speaker");
  await page.getByRole("link", { name: "Shopping Cart" }).click();

  const headphones = page
    .getByRole("heading", { name: "Wireless Headphones" })
    .locator("..")
    .locator("..");
  await headphones.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("heading", { name: "Total Items: 3" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Total Price: $239.97" })).toBeVisible();

  await signUp(page);
  await page.getByRole("link", { name: "Shopping Cart" }).click();
  await page.getByRole("link", { name: "Checkout" }).click();

  const headphonesRow = page.getByRole("row", { name: /Wireless Headphones/ });
  await expect(headphonesRow).toContainText("2");
  await expect(headphonesRow).toContainText("$199.98");
  await expect(page.getByRole("row", { name: /Total/ })).toContainText("$239.97");

  await page.getByLabel("Address").fill("5000 Forbes Avenue");
  await page.getByLabel("Phone").fill("4125550123");
  await page.getByLabel("Notes").fill("Leave at the front desk.");
  await page.getByRole("button", { name: "Place Order" }).click();

  await expect(page.getByRole("heading", { name: "Order Complete!" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart"))))
    .toEqual([]);
  await expect(page).toHaveURL("/", { timeout: 6_000 });
});

test("redirects direct checkout navigation when the cart is empty", async ({ page }) => {
  await page.goto("/checkout");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Featured Products" })).toBeVisible();
});
