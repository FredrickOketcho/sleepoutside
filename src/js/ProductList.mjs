import { renderListWithTemplate } from './utils.mjs';

function productCardTemplate(product) {
  const productUrl = `/product_pages/index.html?product=${encodeURIComponent(product.Id)}`;
  const finalPrice = Number(product.FinalPrice);
  const suggestedRetailPrice = Number(product.SuggestedRetailPrice);
  const hasDiscount =
    Number.isFinite(finalPrice) &&
    Number.isFinite(suggestedRetailPrice) &&
    suggestedRetailPrice > finalPrice;
  const discountDetails = hasDiscount
    ? `<p class="product-card__discount">${Math.round(((suggestedRetailPrice - finalPrice) / suggestedRetailPrice) * 100)}% off</p>
      <p class="product-card__original-price">Was <s>$${suggestedRetailPrice.toFixed(2)}</s></p>`
    : '';

  return `<li class="product-card">
    <a href="${productUrl}">
      <img src="${product.Image}" alt="${product.Name}" />
      <h3 class="card__brand">${product.Brand.Name}</h3>
      <h2 class="card__name">${product.NameWithoutBrand}</h2>
      <p class="product-card__price">$${finalPrice.toFixed(2)}</p>
      ${discountDetails}
    </a>
  </li>`;
}

export default class ProductList {
  constructor(category, dataSource, listElement, searchQuery = '') {
    this.category = category;
    this.dataSource = dataSource;
    this.listElement = listElement;
    this.searchQuery = searchQuery;
    this.statusElement = document.getElementById('productListStatus');
  }

  async init() {
    try {
      const products = this.searchQuery
        ? await this.dataSource.searchProducts(this.searchQuery)
        : await this.dataSource.getData();
      const availableIds = this.listElement.dataset.productIds
        ?.split(',')
        .map((id) => id.trim());
      const displayProducts = availableIds
        ? products.filter((product) => availableIds.includes(product.Id))
        : products;

      this.renderList(displayProducts);
      this.statusElement.textContent = displayProducts.length
        ? ''
        : this.searchQuery
          ? `No products found for “${this.searchQuery}”.`
          : 'No products are available right now.';
    } catch (error) {
      console.error(
        this.searchQuery
          ? `Unable to search for "${this.searchQuery}".`
          : `Unable to load ${this.category} products.`,
        error,
      );
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
