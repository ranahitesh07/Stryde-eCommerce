/**
 * STRYDE — My Orders
 * localStorage key : "stryde-orders"
 * Order format     : { id, date, total, items: [{ name, price, image, quantity }] }
 * Display order    : latest first (reversed)
 */

(function () {
  'use strict';

  const ORDERS_KEY = 'stryde-orders';

  // ── DOM ──
  const listEl      = document.getElementById('ordersList');
  const emptyEl     = document.getElementById('emptyState');
  const countEl     = document.getElementById('orderCount');
  const cardTpl     = document.getElementById('orderCardTemplate');
  const itemTpl     = document.getElementById('itemRowTemplate');

  // ── LOAD ORDERS ──
  async function getOrders() {

  const user = JSON.parse(
    localStorage.getItem('stryde-current-user')
  );

  if (!user || !user.email) {
    return [];
  }

  try {

    const response = await fetch(
      'http://localhost:8080/StrydeBackend/GetOrdersServlet?email='
      + encodeURIComponent(user.email)
    );

    return await response.json();

  } catch (err) {
    console.error(err);
    return [];
  }
}

  // ── RENDER ──
  async function render() {

    listEl.innerHTML = "";

    const orders = await getOrders();

    if (!orders.length) {

      emptyEl.style.display = 'flex';
      listEl.style.display  = 'none';
      countEl.textContent   = '';

      return;
    }

    emptyEl.style.display = 'none';
    listEl.style.display  = 'flex';

    // Latest first
    const sorted = [...orders].reverse();

    countEl.textContent =
      sorted.length === 1
        ? '1 order'
        : sorted.length + ' orders';

    sorted.forEach(function (order) {

      const card = buildCard(order);

      listEl.appendChild(card);

    });

  }

  // ── BUILD ORDER CARD ──
  function buildCard(order) {

  const frag = cardTpl.content.cloneNode(true);
  const card = frag.querySelector('.order-card');

  card.querySelector('.order-id').textContent =
    order.orderId;

  card.querySelector('.order-date').textContent =
    formatDate(order.orderDate);

  const itemsContainer =
    card.querySelector('.order-items');

  const row = buildItemRow({
    name: order.productName,
    image: order.productImage,
    price: order.productPrice,
    quantity: order.quantity
  });

  itemsContainer.appendChild(row);

  card.querySelector('.order-items-count').textContent =
    order.quantity + ' item';

  card.querySelector('.order-total-amount').textContent =
    formatCurrency(order.totalAmount);

  return frag;
}

  // ── BUILD ITEM ROW ──
  function buildItemRow(item) {
    const frag = itemTpl.content.cloneNode(true);
    const row  = frag.querySelector('.item-row');

    const qty   = Number(item.quantity) || 1;
    const price = parseFloat(item.price) || 0;
    const lineTotal = price * qty;

    // Thumbnail
    const img         = row.querySelector('.item-thumb');
    const placeholder = row.querySelector('.item-thumb-placeholder');

    if (item.image) {
      img.src = item.image;
      img.alt = item.name || 'Product';
      img.style.display = 'block';
      placeholder.style.display = 'none';
      img.addEventListener('error', function () {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      });
    } else {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    }

    row.querySelector('.item-name').textContent      = item.name || 'Unnamed Product';
    row.querySelector('.item-qty').textContent       = 'Qty: ' + qty;
    row.querySelector('.item-line-total').textContent = formatCurrency(lineTotal);

    return row;
  }

  // ── HELPERS ──
  function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  function formatId(id) {
    if (!id) return '#—';
    const str = String(id);
    // If it looks like a long UUID/hash, truncate and prefix
    if (str.length > 12) return '#' + str.slice(0, 8).toUpperCase() + '…';
    return str.startsWith('#') ? str : '#' + str.toUpperCase();
  }

  // ── INIT ──
  render();

})();
