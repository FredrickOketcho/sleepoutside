const { afterEach, beforeAll, describe, expect, test } = require('@jest/globals');
const jestMock = require('@jest/globals').jest;

let ExternalServices;

beforeAll(async () => {
  ExternalServices = (await import('../js/ExternalServices.mjs')).default;
});

afterEach(() => {
  delete global.fetch;
});

describe('ExternalServices', () => {
  test.each(['tents', 'backpacks', 'sleeping-bags', 'hammocks'])(
    'searches the %s category',
    async (category) => {
      global.fetch = jestMock.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Result: [
            {
              Id: '123AB',
              Images: {
                PrimaryMedium: 'https://example.com/product.jpg',
              },
            },
          ],
        }),
      });

      const products = await new ExternalServices(category).getData();

      expect(global.fetch).toHaveBeenCalledWith(
        `https://wdd330-backend-osp8.onrender.com/products/search/${category}`,
      );
      expect(products[0].Image).toBe('https://example.com/product.jpg');
    },
  );

  test('loads product details by id', async () => {
    global.fetch = jestMock.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Result: {
          Id: '20CXG',
          Images: { PrimarySmall: 'https://example.com/backpack.jpg' },
        },
      }),
    });

    const product = await new ExternalServices().findProductById('20CXG');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://wdd330-backend-osp8.onrender.com/product/20CXG',
    );
    expect(product.Image).toBe('https://example.com/backpack.jpg');
  });
});
