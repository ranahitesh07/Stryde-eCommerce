/**
 * STRYDE — Checkout Logic
 * Cart format: { name, price, image, quantity }
 * Cart key: "stryde-cart"
 */

(function () {
  const CART_KEY = 'stryde-cart';

  // ── DOM REFS ──
  const cartItemsEl   = document.getElementById('cartItems');
  const emptyCartEl   = document.getElementById('emptyCart');
  const orderTotalEl  = document.getElementById('orderTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const successOverlay = document.getElementById('successOverlay');

  const fields = {
    fullName: document.getElementById('fullName'),
    address:  document.getElementById('address'),
    phone:    document.getElementById('phone'),
  };

  // ── LOAD CART ──
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  // ── RENDER CART ──
  function renderCart() {
    const cart = getCart();
    cartItemsEl.innerHTML = '';

    if (!cart.length) {
      emptyCartEl.style.display = 'block';
      orderTotalEl.textContent = '₹0.00';
      return;
    }

    emptyCartEl.style.display = 'none';

    let total = 0;

    cart.forEach(function (item, index) {
      const qty   = Number(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;
      const itemTotal = price * qty;
      total += itemTotal;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.style.animationDelay = (index * 60) + 'ms';

      // Image or placeholder
      let imgHTML;
      if (item.image) {
        imgHTML = `<img
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.name)}"
          class="item-image"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="item-image-placeholder" style="display:none;">
          ${shoeIcon()}
        </div>`;
      } else {
        imgHTML = `<div class="item-image-placeholder">${shoeIcon()}</div>`;
      }

      row.innerHTML = `
        ${imgHTML}
        <div class="item-info">
          <div class="item-name">${escapeHTML(item.name)}</div>
          <div class="item-qty">Qty: ${qty}</div>
        </div>
        <div class="item-price">${formatCurrency(itemTotal)}</div>
      `;

      cartItemsEl.appendChild(row);
    });

    // ── CALCULATIONS ──
    const subtotal = total;

    // Shipping (FREE above ₹999, else ₹99)
    const shipping = subtotal > 999 ? 0 : 99;

    // Tax (18%)
    const tax = Math.round(subtotal * 0.18);

    // Final total
    const finalTotal = subtotal + tax + shipping;

    // ── UPDATE UI ──
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : formatCurrency(shipping);
    document.getElementById('tax').textContent = formatCurrency(tax);
    orderTotalEl.textContent = formatCurrency(finalTotal);
  }

  // ── VALIDATION ──
  function validateFields() {
    let valid = true;

    // Full Name

    const user = JSON.parse(localStorage.getItem("stryde-current-user"));

    if (user && user.name) {
      document.getElementById("fullName").value = user.name;
    }

    const name = fields.fullName.value.trim();
    if (!name || name.length < 2) {
      setError('fullName', 'Please enter your full name.');
      valid = false;
    } else {
      clearError('fullName');
    }

    // Address
    const address = fields.address.value.trim();
    if (!address || address.length < 5) {
      setError('address', 'Please enter a valid address.');
      valid = false;
    } else {
      clearError('address');
    }

    // Phone — allows digits, spaces, dashes, parens, +
    const phone = fields.phone.value.trim();
    const phoneRegex = /^[+\d][\d\s\-().]{6,19}$/;
    if (!phone || !phoneRegex.test(phone)) {
      setError('phone', 'Please enter a valid phone number.');
      valid = false;
    } else {
      clearError('phone');
    }

    return valid;
  }

  function setError(fieldKey, msg) {
    fields[fieldKey].classList.add('error');
    document.getElementById('error-' + fieldKey).textContent = msg;
  }

  function clearError(fieldKey) {
    fields[fieldKey].classList.remove('error');
    document.getElementById('error-' + fieldKey).textContent = '';
  }

  // Live clear errors on input
  Object.keys(fields).forEach(function (key) {
    fields[key].addEventListener('input', function () {
      clearError(key);
    });
  });

// ── PLACE ORDER ──
placeOrderBtn.addEventListener('click', function () {
  const cart = getCart();

  if (!cart.length) {
    emptyCartEl.style.display = 'block';
    return;
  }
  
  if (!validateFields()) return;

  // ── CALCULATE TOTAL AGAIN ──
  let total = 0;

  cart.forEach(item => {
    const qty = Number(item.quantity) || 1;
    const price = parseFloat(item.price) || 0;
    total += price * qty;
  });

  const subtotal = total;
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const finalTotal = subtotal + tax + shipping;

  // ── SAVE ORDER ✅ ──
  let orders = JSON.parse(localStorage.getItem('stryde-orders')) || [];

  const newOrder = {
    id: Date.now(),
    items: cart,
    total: finalTotal,
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  };

  orders.push(newOrder);
  localStorage.setItem('stryde-orders', JSON.stringify(orders));

  // Show success overlay
  successOverlay.classList.add('active');

  // Clear cart AFTER saving
  localStorage.removeItem(CART_KEY);

  // Redirect
  setTimeout(function () {
    window.location.href = 'orders.html';
  }, 3000);
});

  // ── HELPERS ──
  function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  }

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shoeIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 16l2-6 5 2 4-6 7 4-1 6H2z"/>
    </svg>`;
  }

  // ── INIT ──
  renderCart();

})();
