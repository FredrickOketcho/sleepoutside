function convertToJson(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export default class ExternalServices {
  constructor(category) {
    this.category = category;
    this.path = category ? `../json/${this.category}.json` : null;
  }

  getData() {
    if (!this.path) {
      throw new Error('A product category is required to fetch products.');
    }
    return fetch(this.path).then(convertToJson);
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
