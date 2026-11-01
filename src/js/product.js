import { getCartItems, setLocalStorage } from './utils.mjs';
import ExternalServices from './ExternalServices.mjs';

const dataSource = new ExternalServices('tents');

function addProductToCart(product) {
  const cartItems = getCartItems();
  cartItems.push(product);
  setLocalStorage('so-cart', cartItems);
}
// add to cart button event handler
async function addToCartHandler(e) {
  const product = await dataSource.findProductById(e.target.dataset.id);
  addProductToCart(product);
}

// add listener to Add to Cart button
document
  .getElementById('addToCart')
  .addEventListener('click', addToCartHandler);
