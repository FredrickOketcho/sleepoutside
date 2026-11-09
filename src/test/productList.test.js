const { afterEach, beforeAll, describe, expect, test } = require('@jest/globals');
let ProductList;

beforeAll(async () => {
  ProductList = (await import('../js/ProductList.mjs')).default;
});

afterEach(() => {
  delete global.document;
});

function renderProduct(product) {
  const listElement = {
    dataset: {},
    innerHTML: '',
    insertAdjacentHTML(position, html) {
      this.innerHTML = `${html}${this.innerHTML}`;
    },
  };
  global.document = { getElementById: () => ({ textContent: '' }) };

  new ProductList('tents', {}, listElement).renderList([product]);

  return listElement.innerHTML;
}

describe('product listing discount display', () => {
  const product = {
    Id: '123AB',
    Image: '/images/tent.jpg',
    Name: 'Trail Tent',
    NameWithoutBrand: 'Trail Tent',
    Brand: { Name: 'Outdoor Co.' },
    FinalPrice: 80,
    SuggestedRetailPrice: 100,
  };

  test('shows the discount percentage and original price when discounted', () => {
    const markup = renderProduct(product);

    expect(markup).toContain('product-card__discount">20% off');
    expect(markup).toContain('Was <s>$100.00</s>');
    expect(markup).toContain('product-card__price">$80.00');
  });

  test('does not show a discount indicator when prices are equal', () => {
    const markup = renderProduct({
      ...product,
      FinalPrice: 100,
    });

    expect(markup).not.toContain('product-card__discount');
    expect(markup).not.toContain('product-card__original-price');
  });
});
