import ExternalServices from './ExternalServices.mjs';
import ProductList from './ProductList.mjs';
import { getParam, loadHeaderFooter } from './utils.mjs';

loadHeaderFooter();

const categories = {
  tents: 'Tents',
  backpacks: 'Backpacks',
  'sleeping-bags': 'Sleeping Bags',
  hammocks: 'Hammocks',
};
const category = getParam('category');
const title = document.querySelector('#category-title');
const status = document.querySelector('#productListStatus');
const list = document.querySelector('.product-list');

if (!categories[category]) {
  title.textContent = 'Products';
  status.textContent = 'Choose a valid product category.';
} else {
  title.textContent = categories[category];
  const productList = new ProductList(
    category,
    new ExternalServices(category),
    list,
  );
  productList.init();
}
