import { renderListWithTemplate } from './utils.mjs';

function productCardTemplate(product) {
  const productUrl = `product_pages/index.html?product=${encodeURIComponent(product.Id)}`;
  const price = Number(product.FinalPrice).toFixed(2);

  return `<li class="product-card">
    <a href="${productUrl}">
      <img src="${product.Image}" alt="${product.Name}" />
      <h3 class="card__brand">${product.Brand.Name}</h3>
      <h2 class="card__name">${product.NameWithoutBrand}</h2>
      <p class="product-card__price">$${price}</p>
    </a>
  </li>`;
}

export default class ProductList {
  constructor(category, dataSource, listElement) {
    this.category = category;
    this.dataSource = dataSource;
    this.listElement = listElement;
    this.statusElement = document.getElementById('productListStatus');
  }

  async init() {
    try {
      const products = await this.dataSource.getData();
      const availableIds = this.listElement.dataset.productIds
        ?.split(',')
        .map((id) => id.trim());
      const displayProducts = availableIds
        ? products.filter((product) => availableIds.includes(product.Id))
        : products;

      this.renderList(displayProducts);
      this.statusElement.textContent = displayProducts.length
        ? ''
        : 'No products are available right now.';
    } catch (error) {
      console.error(`Unable to load ${this.category} products.`, error);
      this.statusElement.textContent =
        'We could not load products. Please try again later.';
    }
  }

  renderList(list) {
    renderListWithTemplate(
      productCardTemplate,
      this.listElement,
      list,
      'afterbegin',
      true,
    );
  }
}
