const { afterEach, beforeAll, describe, expect, test } = require('@jest/globals');
const jestMock = require('@jest/globals').jest;

let utils;

beforeAll(async () => {
  utils = await import('../js/utils.mjs');
});

afterEach(() => {
  delete global.document;
  delete global.fetch;
});

describe('renderWithTemplate', () => {
  test('inserts the template into the parent element', () => {
    const parentElement = { innerHTML: '' };

    utils.renderWithTemplate('<p>Loaded</p>', parentElement);

    expect(parentElement.innerHTML).toBe('<p>Loaded</p>');
  });

  test('calls the optional callback with data', () => {
    const parentElement = { innerHTML: '' };
    const data = { itemCount: 2 };
    const callback = jestMock.fn();

    utils.renderWithTemplate('<p>Loaded</p>', parentElement, data, callback);

    expect(callback).toHaveBeenCalledWith(data);
  });
});

describe('loadTemplate', () => {
  test('returns the fetched template text', async () => {
    global.fetch = jestMock.fn().mockResolvedValue({
      ok: true,
      text: async () => '<footer>Footer</footer>',
    });

    await expect(utils.loadTemplate('/partials/footer.html')).resolves.toBe(
      '<footer>Footer</footer>',
    );
    expect(global.fetch).toHaveBeenCalledWith('/partials/footer.html');
  });

  test('throws when the template request fails', async () => {
    global.fetch = jestMock.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(utils.loadTemplate('/partials/missing.html')).rejects.toThrow(
      'Unable to load template at /partials/missing.html: 404',
    );
  });
});

describe('loadHeaderFooter', () => {
  test('loads and renders both shared partials', async () => {
    const header = { innerHTML: '' };
    const footer = { innerHTML: '' };
    global.document = {
      querySelector: jestMock.fn((selector) =>
        selector === '#main-header' ? header : footer,
      ),
    };
    global.fetch = jestMock
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<div>Header</div>',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<div>Footer</div>',
      });

    await utils.loadHeaderFooter();

    expect(header.innerHTML).toBe('<div>Header</div>');
    expect(footer.innerHTML).toBe('<div>Footer</div>');
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/partials/header.html');
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/partials/footer.html');
  });

  test('reports missing page placeholders', async () => {
    global.document = { querySelector: () => null };

    await expect(utils.loadHeaderFooter()).rejects.toThrow(
      'Header or footer placeholder is missing from this page.',
    );
  });
});
