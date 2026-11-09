import ShoppingCart from './ShoppingCart.mjs';
import { loadHeaderFooter } from './utils.mjs';

loadHeaderFooter();

const shoppingCart = new ShoppingCart(document.querySelector('.product-list'));
shoppingCart.init();
