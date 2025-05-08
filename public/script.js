let cart = [];
let allMenuItems = [];

// Load all menu items and initialize filter
async function loadMenuItems() {
  try {
    const res = await fetch('/api/menu');
    const data = await res.json();
    allMenuItems = data;
    renderMenuItems('All');
  } catch (error) {
    console.error('Error loading menu:', error);
  }
}

// Render menu items filtered by category
function renderMenuItems(categoryFilter = 'All') {
  const menuContainer = document.getElementById('menuContainer');
  menuContainer.innerHTML = '';

  const categories = {};
  allMenuItems.forEach(item => {
    const cat = item.category || 'Others';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  for (const category in categories) {
    if (categoryFilter !== 'All' && category !== categoryFilter) continue;

    const section = document.createElement('div');
    section.className = 'category-section';

    const heading = document.createElement('h2');
    heading.textContent = category;
    section.appendChild(heading);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'menu-items';

    categories[category].forEach(item => {
      const card = document.createElement('div');
      card.className = 'menu-item';
      card.innerHTML = `
        <img src="${item.imageUrl}" alt="${item.name}" width="100" />
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
        ${item.flavour ? `<p><strong>Flavour:</strong> ${item.flavour}</p>` : ''}
        <button onclick="addToCart('${item.name}', ${item.price})">Add to Cart</button>
      `;
      itemsContainer.appendChild(card);
    });

    section.appendChild(itemsContainer);
    menuContainer.appendChild(section);
  }
}

// Handle category tab click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.category-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const selectedCategory = btn.getAttribute('data-category');
      renderMenuItems(selectedCategory);
    });
  });
});

// Cart logic
function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.quantity++;
    existing.total = existing.quantity * existing.price;
  } else {
    cart.push({ name, price, quantity: 1, total: price });
  }
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById('cartContainer');
  cartContainer.innerHTML = '';

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p>Cart is empty</p>';
    return;
  }

  cart.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <strong>${item.name}</strong><br>
      ₹${item.price} x 
      <button onclick="decreaseQty(${index})">-</button> 
      ${item.quantity} 
      <button onclick="increaseQty(${index})">+</button>
      = ₹${item.total}
      <br>
      <button onclick="placeOrder(${index})">Place Order</button>
    `;
    cartContainer.appendChild(div);
  });
}

function increaseQty(index) {
  cart[index].quantity++;
  cart[index].total = cart[index].quantity * cart[index].price;
  renderCart();
}

function decreaseQty(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
    cart[index].total = cart[index].quantity * cart[index].price;
  } else {
    cart.splice(index, 1);
  }
  renderCart();
}

async function placeOrder(index) {
  const item = cart[index];
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: item.name,
        quantity: item.quantity,
        totalAmount: item.total
      })
    });

    if (res.ok) {
      alert('Order placed!');
      cart.splice(index, 1);
      renderCart();
      loadOrders();
    } else {
      throw new Error('Failed to place order');
    }
  } catch (error) {
    console.error('Order error:', error);
  }
}

// Load and display orders
async function loadOrders() {
  try {
    const res = await fetch('/api/orders');
    const data = await res.json();
    const list = document.getElementById('order-list');
    list.innerHTML = '';

    data.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-item';
      div.innerHTML = `
        <strong>${order.itemName}</strong><br/>
        Quantity: ${order.quantity} | Total: ₹${order.totalAmount}<br/>
        <em>Status: Preparing</em>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

// Post a new menu item
document.getElementById('menuForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const category = document.getElementById('itemCategory').value;
  const flavourInput = document.querySelector('[name="flavour"]');
  const flavour = flavourInput && flavourInput.style.display !== 'none' ? flavourInput.value : "";

  formData.append('category', category);
  if (flavour) {
    formData.append('flavour', flavour);
  }

  try {
    const res = await fetch('/api/menu', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      alert('Item posted!');
      form.reset();
      flavourInput.style.display = 'none';
      loadMenuItems();
      loadRecommendedItems();
    } else {
      const err = await res.json();
      alert(`Error: ${err.message}`);
    }
  } catch (error) {
    console.error('Failed to post item:', error);
  }
});

// Show/hide flavour input
document.getElementById('itemCategory').addEventListener('change', function () {
  const flavourField = document.getElementById('flavourField');
  if (this.value === 'Snacks') {
    flavourField.style.display = 'block';
  } else {
    flavourField.style.display = 'none';
  }
});

// Load recommended items (for Home)
async function loadRecommendedItems() {
  try {
    const res = await fetch("/api/menu");
    const items = await res.json();

    const recommendedContainer = document.getElementById("recommendedContainer");
    recommendedContainer.innerHTML = "";

    items.slice(0, 4).forEach(item => {
      const div = document.createElement("div");
      div.className = "recommend-card";
      div.innerHTML = `
        <img src="${item.imageUrl}" alt="${item.name}" />
        <h4>${item.name}</h4>
        <p>₹${item.price}</p>
      `;
      recommendedContainer.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading recommended items:", error);
  }
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadMenuItems();
  loadOrders();
  loadRecommendedItems();
});
