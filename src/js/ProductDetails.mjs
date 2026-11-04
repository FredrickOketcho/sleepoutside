import { getCartItems, setLocalStorage } from './utils.mjs';

export default class ProductDetails {
  constructor(productId, dataSource) {
    this.productId = productId;
    this.product = null;
    this.dataSource = dataSource;
  }

  async init() {
    try {
      this.product = await this.dataSource.findProductById(this.productId);

      if (!this.product) {
        this.showMessage('We could not find that product.');
        return;
      }

      this.renderProductDetails();
      this.showMessage('');
      document
        .getElementById('addToCart')
        .addEventListener('click', this.addProductToCart.bind(this));
    } catch (error) {
      console.error('Unable to load product details.', error);
      this.showMessage('We could not load this product. Please try again later.');
    }
  }

  addProductToCart() {
    const cartItems = getCartItems();
    cartItems.push(this.product);
    setLocalStorage('so-cart', cartItems);
    document.getElementById('productStatus').textContent =
      'Added to your cart.';
  }

  renderProductDetails() {
    const productDetails = document.getElementById('productDetail');
    const colorName = this.product.Colors?.[0]?.ColorName ?? '';
    const price = Number(this.product.FinalPrice).toFixed(2);

    productDetails.innerHTML = `
      <h3>${this.product.Brand.Name}</h3>
      <h2 class="divider">${this.product.NameWithoutBrand}</h2>
      <img class="divider" src="${this.product.Image}" alt="${this.product.Name}" />
      <p class="product-card__price">$${price}</p>
      <p class="product__color">${colorName}</p>
      <p class="product__description">${this.product.DescriptionHtmlSimple}</p>
      <div class="product-detail__add">
        <button id="addToCart" type="button">Add to Cart</button>
      </div>
    `;
  }

  showMessage(message) {
    document.getElementById('productStatus').textContent = message;
  }
}
