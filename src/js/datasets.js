const items = document.querySelectorAll('#items li');
const details = document.querySelector('#details');

items.forEach((item) => {
  console.log('Name:', item.dataset.name);
  console.log('Category:', item.dataset.category);
  console.log('Color:', item.dataset.color);

  item.querySelector('button').addEventListener('click', () => {
    const heading = document.createElement('h2');
    heading.id = 'details-heading';
    heading.textContent = 'Item details';

    const name = document.createElement('p');
    name.textContent = `Name: ${item.dataset.name}`;
    const category = document.createElement('p');
    category.textContent = `Category: ${item.dataset.category}`;
    const color = document.createElement('p');
    color.textContent = `Color: ${item.dataset.color}`;

    details.replaceChildren(heading, name, category, color);
  });
});
