import tents from '../json/tents.json';

const productImages = import.meta.glob('../images/**/*.{jpg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function convertToJson(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

const productData = { tents };

export default class ExternalServices {
  constructor(category) {
    this.category = category;
  }

  getData() {
    const products = productData[this.category];

    if (!products) {
      throw new Error(
        `No product data is available for category "${this.category}".`,
      );
    }

    return Promise.resolve(
      products.map((product) => ({
        ...product,
        Image: productImages[product.Image] ?? product.Image,
      })),
    );
  }

  async findProductById(id) {
    const products = await this.getData();
    return products.find((item) => item.Id === id);
  }

  checkout(payload) {
    return fetch('https://wdd330-backend-osp8.onrender.com/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(convertToJson);
  }
}
