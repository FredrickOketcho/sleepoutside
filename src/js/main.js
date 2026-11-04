import ExternalServices from './ExternalServices.mjs';
import ProductList from './ProductList.mjs';

const dataSource = new ExternalServices('tents');
const productList = new ProductList(
  'tents',
  dataSource,
  document.querySelector('.product-list'),
);

productList.init();