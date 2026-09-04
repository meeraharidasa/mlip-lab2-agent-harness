import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import App from "../App";
import AuthProvider from "../context/AuthContext";
import CartProvider from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";

function renderStore() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}

function addProduct(name) {
  const productLink = screen.getByRole("link", { name });
  const productCard = productLink.closest(".relative");

  fireEvent.click(
    within(productCard).getByRole("button", { name: "Add to Cart" }),
  );
}

function openCart() {
  fireEvent.click(screen.getByRole("link", { name: "Shopping Cart" }));
}

function expectSummary(itemCount, totalPrice) {
  expect(
    screen.getByRole("heading", { name: `Total Items: ${itemCount}` }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      name: `Total Price: $${totalPrice}`,
    }),
  ).toBeInTheDocument();
}

describe("shopping cart", () => {
  beforeAll(() => {
    const storedValues = new Map();

    vi.stubGlobal("localStorage", {
      clear: vi.fn(() => storedValues.clear()),
      getItem: vi.fn((key) => storedValues.get(key) ?? null),
      removeItem: vi.fn((key) => storedValues.delete(key)),
      setItem: vi.fn((key, value) =>
        storedValues.set(key, String(value)),
      ),
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("adds a product and updates the item count and discounted total", () => {
    renderStore();

    addProduct("Wireless Headphones");

    expect(
      within(screen.getByRole("link", { name: "Shopping Cart" })).getByText("1"),
    ).toBeInTheDocument();

    openCart();

    expect(
      screen.getByRole("heading", { name: "Wireless Headphones" }),
    ).toBeInTheDocument();
    expectSummary(1, "89.99");
  });

  it("increases and decreases quantity while updating the cart totals", () => {
    renderStore();
    addProduct("Wireless Headphones");
    openCart();

    fireEvent.click(
      screen.getByRole("button", { name: "Increase quantity" }),
    );
    expectSummary(2, "179.98");

    fireEvent.click(
      screen.getByRole("button", { name: "Decrease quantity" }),
    );
    expectSummary(1, "89.99");
  });

  it("removes an item completely", () => {
    renderStore();
    addProduct("Wireless Headphones");
    openCart();

    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));

    expect(
      screen.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Wireless Headphones" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: "Shopping Cart" })).queryByText(
        "1",
      ),
    ).not.toBeInTheDocument();
  });
});
