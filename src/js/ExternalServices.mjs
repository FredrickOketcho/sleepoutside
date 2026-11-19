const API_BASE = 'https://wdd330-backend-osp8.onrender.com';

async function convertToJson(response) {
  let jsonResponse;
  try {
    jsonResponse = await response.json();
  } catch {
    jsonResponse = { message: `Request failed with status ${response.status}.` };
  }

  if (!response.ok) {
    throw {
      name: 'servicesError',
      message: jsonResponse,
    };
  }

  return jsonResponse;
}

function normalizeProduct(product) {
  return {
    ...product,
    Image:
      product.Images?.PrimaryMedium ??
      product.Images?.PrimarySmall ??
      product.Image,
  };
}

export default class ExternalServices {
  constructor(category) {
    this.category = category;
  }

  async getData() {
    if (!this.category) {
      throw new Error('A product category is required to search products.');
    }

    const response = await fetch(
      `${API_BASE}/products/search/${encodeURIComponent(this.category)}`,
    );
    const data = await convertToJson(response);
    if (!Array.isArray(data.Result)) {
      throw new Error(`The product search for "${this.category}" was invalid.`);
    }

    return data.Result.map(normalizeProduct);
  }

  async searchProducts(query) {
    const searchTerm = query.trim().toLocaleLowerCase();
    if (!searchTerm) return [];

    const categories = ['tents', 'backpacks', 'sleeping-bags', 'hammocks'];
    const categoryResults = await Promise.all(
      categories.map((category) => new ExternalServices(category).getData()),
    );
    const uniqueProducts = new Map();

    categoryResults.flat().forEach((product) => {
      uniqueProducts.set(product.Id, product);
    });

    return [...uniqueProducts.values()].filter((product) => {
      const searchableText = [
        product.Name,
        product.NameWithoutBrand,
        product.Brand?.Name,
        product.DescriptionHtmlSimple,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();

      return searchableText.includes(searchTerm);
    });
  }

  async findProductById(id) {
    if (!id) {
      throw new Error('A product id is required to load product details.');
    }

    const response = await fetch(
      `${API_BASE}/product/${encodeURIComponent(id)}`,
    );
    const data = await convertToJson(response);
    if (!data.Result || typeof data.Result !== 'object') {
      throw new Error(`The product details for "${id}" were invalid.`);
    }

    return normalizeProduct(data.Result);
  }

  checkout(payload) {
    return fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(convertToJson);
  }
}
