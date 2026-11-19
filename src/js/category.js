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
const searchQuery = (getParam('q') ?? '').trim();
const title = document.querySelector('#category-title');
const status = document.querySelector('#productListStatus');
const list = document.querySelector('.product-list');

if (searchQuery) {
  title.textContent = `Search results for “${searchQuery}”`;
  document.querySelector('.products > p:first-child').hidden = true;
  const productList = new ProductList(
    '',
    new ExternalServices(),
    list,
    searchQuery,
  );
  productList.init();
} else if (!categories[category]) {
  title.textContent = 'Top Products';
  status.textContent = 'Choose a valid product category.';
} else {
  title.textContent = `Top Products: ${categories[category]}`;
  const productList = new ProductList(
    category,
    new ExternalServices(category),
    list,
  );
  productList.init();
}
