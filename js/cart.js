// ─────────────────────────────────────────────────────────────
//  cart.js  —  Stryde Cart Page Logic
//
//  What this file does:
//  1. Reads cart data from localStorage
//  2. Draws each item as a row on the page
//  3. Lets the user change quantity or remove items
//  4. Keeps the order summary (subtotal, tax, total) up to date
//  5. Shows an empty state when the cart has no items
//
//  Depends on: localStorage key "stryde-cart"
//  Called after: main.js (which handles the navbar)
// ─────────────────────────────────────────────────────────────


// ── Step 1: Read & write the cart ────────────────────────────

/*
  getCart()
  ---------
  Opens localStorage, finds our cart data, and returns it
  as a JavaScript array of objects. Returns [] if nothing
  is stored yet (e.g. first-time visitor).
*/
function getCart() {
  var stored = localStorage.getItem('stryde-cart');
  return stored ? JSON.parse(stored) : [];
}

/*
  saveCart(cart)
  --------------
  Takes the current cart array and saves it back to
  localStorage so the data survives a page refresh.
*/
function saveCart(cart) {
  localStorage.setItem('stryde-cart', JSON.stringify(cart));
}


// ── Step 2: Utility helpers ───────────────────────────────────

/*
  formatPrice(amount)
  -------------------
  Turns a plain number like 12995 into "₹12,995"
  using India's number format (en-IN locale).
*/
function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/*
  getTotalItemCount()
  -------------------
  Adds up the quantity of every item in the cart.
  e.g. 2 shoes + 1 tee = 3 total items.
*/
function getTotalItemCount() {
  var cart = getCart();
  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    total += cart[i].quantity;
  }
  return total;
}

/*
  updateNavbarBadge()
  -------------------
  Updates the little number on the cart icon in the navbar.
  Hides the badge completely when the cart is empty.
*/
function updateNavbarBadge() {
  var badge = document.querySelector('.cart-badge');
  if (!badge) return; // safety check: badge might not exist on this page

  var count = getTotalItemCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}


// ── Step 3: Change quantity ───────────────────────────────────

/*
  changeQuantity(name, delta)
  ---------------------------
  name  — the product name (used to find it in the cart)
  delta — +1 to increase, -1 to decrease

  If quantity drops to 0 or below, the item is removed.
  After updating, the page re-renders automatically.
*/
function changeQuantity(name, delta) {
  var cart = getCart();

  // Find the item whose name matches
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].name === name) {
      cart[i].quantity += delta;

      // If quantity hits 0, remove this item from the array
      if (cart[i].quantity <= 0) {
        cart.splice(i, 1); // splice removes 1 element at position i
      }

      break; // stop the loop — we found and updated our item
    }
  }

  saveCart(cart);
  renderCart();        // redraw the whole page
  updateNavbarBadge(); // sync the navbar icon
}


// ── Step 4: Remove an item completely ────────────────────────

/*
  removeItem(name)
  ----------------
  Filters out the item with the matching name and
  saves the shorter cart back to localStorage.
*/
function removeItem(name) {
  var cart = getCart();

  // Keep every item whose name is NOT the one we want to remove
  var updatedCart = cart.filter(function(item) {
    return item.name !== name;
  });

  saveCart(updatedCart);
  renderCart();
  updateNavbarBadge();
}


// ── Step 5: Build HTML for one cart row ──────────────────────

/*
  buildCartRow(item)
  ------------------
  Takes one cart item object and returns a ready-to-use
  <div> element with image, name, price, qty controls,
  subtotal, and a remove button.

  We build it with createElement (not innerHTML) so event
  listeners can be attached cleanly without re-querying the DOM.
*/
function buildCartRow(item) {
  var subtotal = item.price * item.quantity;

  // Outer row wrapper
  var row = document.createElement('div');
  row.className = 'cart-item';

  // Product image
  var img = document.createElement('img');
  img.className = 'cart-item-image';
  img.src = item.image;
  img.alt = item.name;
  img.loading = 'lazy';

  // Info block (name + unit price + qty controls)
  var info = document.createElement('div');
  info.className = 'cart-item-info';

  var name = document.createElement('p');
  name.className = 'cart-item-name';
  name.textContent = item.name;

  var price = document.createElement('p');
  price.className = 'cart-item-price';
  price.textContent = formatPrice(item.price);

  // Quantity control: [ − ] [ 2 ] [ + ]
  var qtyWrap = document.createElement('div');
  qtyWrap.className = 'cart-item-qty';

  var minusBtn = document.createElement('button');
  minusBtn.className = 'qty-btn qty-minus';
  minusBtn.textContent = '−';
  minusBtn.setAttribute('aria-label', 'Decrease quantity');

  var qtyValue = document.createElement('span');
  qtyValue.className = 'qty-value';
  qtyValue.textContent = item.quantity;

  var plusBtn = document.createElement('button');
  plusBtn.className = 'qty-btn qty-plus';
  plusBtn.textContent = '+';
  plusBtn.setAttribute('aria-label', 'Increase quantity');

  // Wire up quantity buttons
  minusBtn.addEventListener('click', function() {
    changeQuantity(item.name, -1);
  });

  plusBtn.addEventListener('click', function() {
    changeQuantity(item.name, +1);
  });

  qtyWrap.appendChild(minusBtn);
  qtyWrap.appendChild(qtyValue);
  qtyWrap.appendChild(plusBtn);

  info.appendChild(name);
  info.appendChild(price);
  info.appendChild(qtyWrap);

  // Right column: subtotal + remove button
  var right = document.createElement('div');
  right.className = 'cart-item-right';

  var subtotalEl = document.createElement('span');
  subtotalEl.className = 'cart-item-subtotal';
  subtotalEl.textContent = formatPrice(subtotal);

  var removeBtn = document.createElement('button');
  removeBtn.className = 'cart-remove-btn';
  removeBtn.innerHTML = `
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
`;
  removeBtn.setAttribute('aria-label', 'Remove ' + item.name);

  removeBtn.addEventListener('click', function() {
    removeItem(item.name);
  });

  right.appendChild(subtotalEl);
  right.appendChild(removeBtn);

  // Assemble the row
  row.appendChild(img);
  row.appendChild(info);
  row.appendChild(right);

  return row; // return the finished DOM element
}


// ── Step 6: Build the empty-cart message ─────────────────────

/*
  buildEmptyState()
  -----------------
  Returns a simple block shown when the cart has no items.
  Includes a "Shop Now" link back to the homepage.
*/
function buildEmptyState() {
  var empty = document.createElement('div');
  empty.className = 'cart-empty';

  // Bag icon
  empty.innerHTML =
    '<svg class="cart-empty-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
      '<line x1="3" y1="6" x2="21" y2="6"/>' +
      '<path d="M16 10a4 4 0 01-8 0"/>' +
    '</svg>' +
    '<h2 class="cart-empty-title">Your cart is empty</h2>' +
    '<p class="cart-empty-sub">Looks like you haven\'t added anything yet.</p>' +
    '<a href="index.html" class="btn-checkout" style="max-width:240px;margin:0 auto;">' +
      'Shop Now' +
    '</a>';

  return empty;
}


// ── Step 7: Update the order summary numbers ─────────────────

/*
  updateSummary(cart)
  -------------------
  Recalculates subtotal, GST tax, and grand total
  and writes them into the summary panel on the right.
  Hides the whole summary panel if the cart is empty.
*/
function updateSummary(cart) {
  // Add up price × quantity for every item
  var subtotal = 0;
  for (var i = 0; i < cart.length; i++) {
    subtotal += cart[i].price * cart[i].quantity;
  }

  var tax   = Math.round(subtotal * 0.18); // 18% GST
  var total = subtotal + tax;              // shipping is always FREE

  // Write the values into the summary panel
  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal);
  document.getElementById('summaryTax').textContent      = formatPrice(tax);
  document.getElementById('summaryTotal').textContent    = formatPrice(total);

  // Hide the summary panel when cart is empty
  var summaryPanel = document.getElementById('cartSummary');
  summaryPanel.style.display = cart.length > 0 ? '' : 'none';
}


// ── Step 8: Main render — draws the whole cart ───────────────

/*
  renderCart()
  ------------
  This is the master function. It:
    1. Reads the current cart from localStorage
    2. Clears the item list on the page
    3. Draws the empty state OR one row per item
    4. Updates the item count label
    5. Refreshes the order summary
    6. Syncs the navbar badge

  It is called once on page load, and again after every
  quantity change or item removal.
*/
function renderCart() {
  var cart       = getCart();
  var list       = document.getElementById('cartItemsList');
  var countLabel = document.getElementById('cartItemCount');

  // Clear whatever is currently rendered
  list.innerHTML = '';

  if (cart.length === 0) {
    // Cart is empty — show the empty state
    countLabel.textContent = '0 items';
    list.appendChild(buildEmptyState());

  } else {
    // Cart has items — show the count label
    var totalItems = getTotalItemCount();
    countLabel.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');

    // Build and append one row for each product
    for (var i = 0; i < cart.length; i++) {
      list.appendChild(buildCartRow(cart[i]));
    }
  }

  // Always refresh the summary and badge after rendering
  updateSummary(cart);
  updateNavbarBadge();
}


// ── Step 9: Run everything when the page is ready ────────────

/*
  DOMContentLoaded fires once the HTML is fully parsed.
  We wait for it before touching any DOM elements so we
  don't try to update elements that don't exist yet.
*/
document.addEventListener('DOMContentLoaded', function() {
  renderCart();       // draw the cart immediately on page load
  updateNavbarBadge(); // make sure the badge is correct from the start
});
