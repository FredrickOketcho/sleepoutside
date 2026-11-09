const { afterEach, beforeAll, describe, expect, test } = require('@jest/globals');
const jestMock = require('@jest/globals').jest;

let ShoppingCart;

beforeAll(async () => {
  ShoppingCart = (await import('../js/ShoppingCart.mjs')).default;
});

afterEach(() => {
  delete global.document;
  delete global.localStorage;
});

function setupCart(cartItems) {
  const listElement = {
    innerHTML: '',
    insertAdjacentHTML: jestMock.fn((position, html) => {
      listElement.innerHTML = `${html}${listElement.innerHTML}`;
    }),
  };
  const elements = {
    '#cart-item-count': { textContent: '' },
    '#cart-subtotal': { textContent: '' },
    '#cart-checkout': { hidden: false },
    '#empty-cart-message': { hidden: false },
  };
  global.document = {
    querySelector: (selector) =>
      selector === '.product-list' ? listElement : elements[selector],
  };
  global.localStorage = {
    getItem: jestMock.fn(() => JSON.stringify(cartItems)),
  };
  return { listElement, elements };
}

describe('ShoppingCart', () => {
  test('renders items and calculates the cart summary', () => {
    const { listElement, elements } = setupCart([
      {
        Id: '880RR',
        Image: '/images/tent.jpg',
        Name: 'Ajax Tent',
        Colors: [{ ColorName: 'Pumpkin' }],
        FinalPrice: 199.99,
        quantity: 2,
      },
    ]);

    new ShoppingCart(listElement).init();

    expect(listElement.innerHTML).toContain('Ajax Tent');
    expect(listElement.innerHTML).toContain('qty: 2');
    expect(listElement.innerHTML).toContain('$199.99');
    expect(elements['#cart-item-count'].textContent).toBe('2');
    expect(elements['#cart-subtotal'].textContent).toBe('$399.98');
    expect(elements['#cart-checkout'].hidden).toBe(false);
    expect(elements['#empty-cart-message'].hidden).toBe(true);
  });

  test('shows the empty-cart state when there are no items', () => {
    const { listElement, elements } = setupCart([]);

    new ShoppingCart(listElement).init();

    expect(listElement.innerHTML).toBe('');
    expect(elements['#cart-item-count'].textContent).toBe('0');
    expect(elements['#cart-subtotal'].textContent).toBe('$0.00');
    expect(elements['#cart-checkout'].hidden).toBe(true);
    expect(elements['#empty-cart-message'].hidden).toBe(false);
  });
});
