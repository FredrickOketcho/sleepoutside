import { alertMessage, getCartItems, setBreadcrumb, setLocalStorage } from './utils.mjs';

const categoryLabels = {
  tents: 'Tents',
  backpacks: 'Backpacks',
  'sleeping-bags': 'Sleeping Bags',
  hammocks: 'Hammocks',
};

function escapeAttribute(value = '') {
  return String(value).replace(/[&"<>]/g, (character) => ({
    '&': '&amp;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;',
  })[character]);
}

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

      this.product.Category =
        new URLSearchParams(window.location.search).get('category') ||
        this.product.Category;
      if (categoryLabels[this.product.Category]) {
        setBreadcrumb(categoryLabels[this.product.Category]);
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
    alertMessage(`${this.product.Name} was added to your cart.`, false);
  }

  renderProductDetails() {
    const productDetails = document.getElementById('productDetail');
    const colorName = this.product.Colors?.[0]?.ColorName ?? '';
    const finalPrice = Number(this.product.FinalPrice);
    const suggestedRetailPrice = Number(this.product.SuggestedRetailPrice);
    const price = finalPrice.toFixed(2);
    const hasDiscount =
      Number.isFinite(finalPrice) &&
      Number.isFinite(suggestedRetailPrice) &&
      suggestedRetailPrice > finalPrice;
    const discountDetails = hasDiscount
      ? `<p class="product-detail__discount">Save $${(suggestedRetailPrice - finalPrice).toFixed(2)} (${Math.round(((suggestedRetailPrice - finalPrice) / suggestedRetailPrice) * 100)}% off)</p>
        <p class="product-detail__original-price">Was <s>$${suggestedRetailPrice.toFixed(2)}</s></p>`
      : '';
    const extraImages = Array.isArray(this.product.Images?.ExtraImages)
      ? this.product.Images.ExtraImages.filter((image) => image?.Src)
      : [];
    this.galleryImages = [
      {
        src: this.product.Image,
        srcSet: this.product.ImageSrcSet,
        title: this.product.Name,
      },
      ...extraImages.map((image, index) => ({
        src: image.Src,
        title: image.Title || `Product image ${index + 2}`,
      })),
    ];
    const galleryMarkup = this.galleryImages.length > 1
      ? `<div class="product-gallery" role="group" aria-label="Product images">
          <div class="product-gallery__stage">
            <button class="product-gallery__arrow" type="button" data-gallery-step="-1" aria-label="Previous image">&#10094;</button>
            <img id="product-gallery-image" class="divider" src="${escapeAttribute(this.galleryImages[0].src)}" ${this.galleryImages[0].srcSet ? `srcset="${escapeAttribute(this.galleryImages[0].srcSet)}" sizes="(max-width: 700px) 90vw, 500px"` : ''} alt="${escapeAttribute(this.galleryImages[0].title)}" />
            <button class="product-gallery__arrow" type="button" data-gallery-step="1" aria-label="Next image">&#10095;</button>
          </div>
          <div class="product-gallery__options" role="group" aria-label="Choose a product image">
            ${this.galleryImages.map((image, index) => `<button class="product-gallery__option" type="button" data-gallery-index="${index}" aria-label="Show ${escapeAttribute(image.title)}" aria-pressed="${index === 0}"><img src="${escapeAttribute(image.src)}" alt="" loading="lazy" /><span>${escapeAttribute(image.title)}</span></button>`).join('')}
          </div>
        </div>`
      : `<img class="divider" src="${escapeAttribute(this.galleryImages[0].src)}" ${this.galleryImages[0].srcSet ? `srcset="${escapeAttribute(this.galleryImages[0].srcSet)}" sizes="(max-width: 700px) 90vw, 500px"` : ''} alt="${escapeAttribute(this.galleryImages[0].title)}" />`;

    productDetails.innerHTML = `
      <h3>${this.product.Brand.Name}</h3>
      <h2 class="divider">${this.product.NameWithoutBrand}</h2>
      ${galleryMarkup}
      <p class="product-card__price">$${price}</p>
      ${discountDetails}
      <p class="product__color">${colorName}</p>
      <p class="product__description">${this.product.DescriptionHtmlSimple}</p>
      <div class="product-detail__add">
        <button id="addToCart" type="button">Add to Cart</button>
      </div>
    `;

    if (this.galleryImages.length > 1) this.initGallery(productDetails);
  }

  initGallery(productDetails) {
    const image = productDetails.querySelector('#product-gallery-image');
    const options = [...productDetails.querySelectorAll('[data-gallery-index]')];
    const showImage = (index) => {
      const imageData = this.galleryImages[index];
      image.src = imageData.src;
      image.alt = imageData.title;
      if (imageData.srcSet) {
        image.srcset = imageData.srcSet;
        image.sizes = '(max-width: 700px) 90vw, 500px';
      } else {
        image.removeAttribute('srcset');
        image.removeAttribute('sizes');
      }
      options.forEach((option, optionIndex) => {
        option.setAttribute('aria-pressed', String(optionIndex === index));
      });
    };

    options.forEach((option, index) => {
      option.addEventListener('click', () => showImage(index));
    });
    productDetails.querySelectorAll('[data-gallery-step]').forEach((button) => {
      button.addEventListener('click', () => {
        const currentIndex = options.findIndex(
          (option) => option.getAttribute('aria-pressed') === 'true',
        );
        const step = Number(button.dataset.galleryStep);
        const nextIndex = (currentIndex + step + options.length) % options.length;
        showImage(nextIndex);
      });
    });
  }

  showMessage(message) {
    document.getElementById('productStatus').textContent = message;
  }
}
