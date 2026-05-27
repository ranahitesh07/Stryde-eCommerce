// ─────────────────────────────────────────────────────────────
//  wishlist.js  —  Stryde Wishlist System
//
//  What this file does:
//    1. Reads / writes wishlist data in localStorage
//    2. Syncs heart button states on every product card
//    3. Renders the wishlist grid on wishlist.html
//    4. Handles remove-from-wishlist actions
//
//  localStorage key : "stryde-wishlist"
//  Each item stored : { name, price, image }
//
//  Works alongside the existing cart system — does NOT
//  touch "stryde-cart" or any cart-related functions.
// ─────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════
//  SECTION 1 — Core localStorage helpers
// ══════════════════════════════════════════════

/*
  getWishlist()
  -------------
  Reads "stryde-wishlist" from localStorage and returns
  it as a JavaScript array. Returns [] on first visit.
*/
function getWishlist() {
  var stored = localStorage.getItem('stryde-wishlist');
  return stored ? JSON.parse(stored) : [];
}

/*
  saveWishlist(wishlist)
  ----------------------
  Writes the current wishlist array back to localStorage
  so it survives page refreshes and navigation.
*/
function saveWishlist(wishlist) {
  localStorage.setItem('stryde-wishlist', JSON.stringify(wishlist));
}

/*
  isInWishlist(name)
  ------------------
  Returns true if a product with this name is already
  saved. Used to prevent duplicates.
*/
function isInWishlist(name) {
  var wishlist = getWishlist();
  for (var i = 0; i < wishlist.length; i++) {
    if (wishlist[i].name === name) {
      return true;
    }
  }
  return false;
}


// ══════════════════════════════════════════════
//  SECTION 2 — Add / remove individual items
// ══════════════════════════════════════════════

/*
  addToWishlist(item)
  -------------------
  item = { name, price, image }
  Adds to the wishlist only if it isn't already there.
*/
function addToWishlist(item) {
  if (isInWishlist(item.name)) {
    return; // prevent duplicates — silently exit
  }
  var wishlist = getWishlist();
  wishlist.push(item);
  saveWishlist(wishlist);
}

/*
  removeFromWishlist(name)
  ------------------------
  Filters out the item with the matching name and
  saves the updated array back to localStorage.
*/
function removeFromWishlist(name) {
  var wishlist = getWishlist();
  var updated = wishlist.filter(function (item) {
    return item.name !== name;
  });
  saveWishlist(updated);
}


// ══════════════════════════════════════════════
//  SECTION 3 — Heart button toggle logic
//              (runs on product card pages)
// ══════════════════════════════════════════════

/*
  syncHeartButtons()
  ------------------
  Loops over every .wishlist-btn on the page and sets
  its "active" class to match the current wishlist state.
  Call this on page load so hearts reflect localStorage.
*/
function syncHeartButtons() {
  var buttons = document.querySelectorAll('.wishlist-btn');
  buttons.forEach(function (btn) {
    var card  = btn.closest('.product-card');
    var name  = getProductName(card);

    if (isInWishlist(name)) {
      btn.classList.add('active');
      btn.setAttribute('aria-label', 'Remove from wishlist');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-label', 'Add to wishlist');
    }
  });
}

/*
  handleWishlistToggle(btn)
  -------------------------
  Called when a wishlist heart button is clicked.
  Reads product data from the card's DOM, then toggles
  the item in/out of localStorage and updates the UI.
*/
function handleWishlistToggle(btn) {
  var card  = btn.closest('.product-card');
  var name  = getProductName(card);
  var price = getProductPrice(card);
  var image = getProductImage(card);

  if (isInWishlist(name)) {
    // Already saved — remove it
    removeFromWishlist(name);
    btn.classList.remove('active');
    btn.setAttribute('aria-label', 'Add to wishlist');
    showWishlistToast(name, false);
  } else {
    // Not saved — add it
    addToWishlist({ name: name, price: price, image: image });
    btn.classList.add('active');
    btn.setAttribute('aria-label', 'Remove from wishlist');
    showWishlistToast(name, true);
  }
}

/*
  initWishlistButtons()
  ---------------------
  Attaches click listeners to every .wishlist-btn found
  on the current page. Call once on DOMContentLoaded.
*/
function initWishlistButtons() {
  var buttons = document.querySelectorAll('.wishlist-btn');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); // don't bubble to the card itself
      handleWishlistToggle(btn);
    });
  });
}


// ══════════════════════════════════════════════
//  SECTION 4 — DOM reader helpers
//              Read product data out of a card
// ══════════════════════════════════════════════

/*
  These helpers pull the name, price, and image from a
  .product-card element. They check data-* attributes
  first (most reliable), then fall back to reading the
  live DOM text / src if the attributes aren't set.
*/

function getProductName(card) {
  if (!card) return 'Unknown Product';
  // Prefer data-name on the card, fall back to .card-name text
  if (card.dataset.name) return card.dataset.name;
  var el = card.querySelector('.card-name');
  return el ? el.textContent.trim() : 'Unknown Product';
}

function getProductPrice(card) {
  if (!card) return '';
  if (card.dataset.price) return card.dataset.price;
  var el = card.querySelector('.card-price');
  return el ? el.textContent.trim() : '';
}

function getProductImage(card) {
  if (!card) return '';
  if (card.dataset.image) return card.dataset.image;
  var el = card.querySelector('img');
  return el ? el.src : '';
}


// ══════════════════════════════════════════════
//  SECTION 5 — Toast notification
// ══════════════════════════════════════════════

/*
  showWishlistToast(name, added)
  ------------------------------
  Briefly shows a small notification at the bottom of
  the screen confirming the action. No CSS file needed —
  the toast injects its own minimal styles once.
*/

var toastStylesInjected = false;

function injectToastStyles() {
  if (toastStylesInjected) return;
  toastStylesInjected = true;

  var style = document.createElement('style');
  style.textContent = [
    '.stryde-toast {',
    '  position: fixed;',
    '  bottom: 28px;',
    '  left: 50%;',
    '  transform: translateX(-50%) translateY(12px);',
    '  background: #080808;',
    '  color: #ffffff;',
    '  font-family: "Barlow", sans-serif;',
    '  font-size: 0.78rem;',
    '  font-weight: 600;',
    '  letter-spacing: 0.08em;',
    '  padding: 12px 24px;',
    '  border-radius: 4px;',
    '  opacity: 0;',
    '  pointer-events: none;',
    '  transition: opacity 0.25s ease, transform 0.25s ease;',
    '  z-index: 9999;',
    '  white-space: nowrap;',
    '}',
    '.stryde-toast.show {',
    '  opacity: 1;',
    '  transform: translateX(-50%) translateY(0);',
    '}'
  ].join('\n');
  document.head.appendChild(style);
}

function showWishlistToast(name, added) {
  injectToastStyles();

  // Remove any existing toast first
  var existing = document.getElementById('strydeWishlistToast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'strydeWishlistToast';
  toast.className = 'stryde-toast';
  toast.textContent = added
    ? '♥ Added to Wishlist'
    : '♡ Removed from Wishlist';

  document.body.appendChild(toast);

  // Trigger show after a tiny delay so the transition fires
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });
  });

  // Auto-hide after 2 seconds
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 2000);
}


// ══════════════════════════════════════════════
//  SECTION 6 — Wishlist page renderer
//              (runs only on wishlist.html)
// ══════════════════════════════════════════════

/*
  renderWishlistPage()
  --------------------
  Reads the wishlist from localStorage and builds the
  grid of cards. If empty, shows the empty state message.
  Called once on DOMContentLoaded on wishlist.html.
*/
function renderWishlistPage() {
  var grid     = document.getElementById('wishlistGrid');
  var emptyMsg = document.getElementById('wishlistEmpty');
  if (!grid) return; // not on wishlist.html — exit safely

  var wishlist = getWishlist();

  // Clear whatever is already rendered
  grid.innerHTML = '';

  if (wishlist.length === 0) {
    // Show empty state, hide grid
    if (emptyMsg) emptyMsg.style.display = 'block';
    grid.style.display = 'none';
    return;
  }

  // Hide empty state, show grid
  if (emptyMsg) emptyMsg.style.display = 'none';
  grid.style.display = '';

  // Build one card per wishlist item
  wishlist.forEach(function (item) {
    grid.appendChild(buildWishlistCard(item));
  });
}

/*
  buildWishlistCard(item)
  -----------------------
  Returns a DOM element for a single wishlist card.
  item = { name, price, image }
*/
function buildWishlistCard(item) {
  var card = document.createElement('div');
  card.className = 'wishlist-card';
  card.setAttribute('data-name', item.name);

  // Image
  var img = document.createElement('img');
  img.className = 'wishlist-card-image';
  img.src = item.image || '';
  img.alt = item.name;
  img.loading = 'lazy';

  // Body
  var body = document.createElement('div');
  body.className = 'wishlist-card-body';

  var name = document.createElement('p');
  name.className = 'wishlist-card-name';
  name.textContent = item.name;

  var price = document.createElement('p');
  price.className = 'wishlist-card-price';
  price.textContent = '₹' + Number(item.price.toString().replace(/[₹,]/g, "")).toLocaleString('en-IN');

  // 🔥 ACTIONS CONTAINER
  var actions = document.createElement('div');
  actions.className = 'wishlist-actions';

  // ✅ ADD TO CART BUTTON
  var addBtn = document.createElement('button');
  addBtn.className = 'add-cart-btn';
  addBtn.textContent = 'Add to Cart';

  addBtn.addEventListener('click', function () {
  addItemToCart(item);

  removeFromWishlist(item.name);
  renderWishlistPage();
});

  // ❌ REMOVE BUTTON (your existing)
  var removeBtn = document.createElement('button');
  removeBtn.className = 'wishlist-remove-btn';
  removeBtn.textContent = 'Remove';

  removeBtn.addEventListener('click', function () {
    removeFromWishlist(item.name);
    removeCardFromDOM(card);
  });

  // Append actions
  actions.appendChild(addBtn);
  actions.appendChild(removeBtn);

  // Build structure
  body.appendChild(name);
  body.appendChild(price);
  body.appendChild(actions);

  card.appendChild(img);
  card.appendChild(body);

  return card;
}

function addItemToCart(item) {
  let cart = JSON.parse(localStorage.getItem("stryde-cart")) || [];

  const existing = cart.find(p => p.name === item.name);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      name: item.name,
      price: Number(item.price.toString().replace(/[₹,]/g, "")), // ✅ FIX
      image: item.image,
      quantity: 1
    });
  }

  localStorage.setItem("stryde-cart", JSON.stringify(cart));

  // ✅ update badge
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  showToast("Added to cart");
}

function showToast(message) {
  let toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/*
  removeCardFromDOM(card)
  -----------------------
  Fades the card out, then removes it from the DOM.
  Checks if the grid is now empty and shows the
  empty state message if so.
*/
function removeCardFromDOM(card) {
  // Fade out
  card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  card.style.opacity    = '0';
  card.style.transform  = 'scale(0.96)';

  setTimeout(function () {
    if (card.parentNode) card.remove();

    // Check if grid is now empty
    var grid     = document.getElementById('wishlistGrid');
    var emptyMsg = document.getElementById('wishlistEmpty');

    if (grid && grid.children.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      grid.style.display = 'none';
    }
  }, 280);
}


// ══════════════════════════════════════════════
//  SECTION 7 — Boot
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  // Always sync heart buttons on any page that has product cards
  syncHeartButtons();
  initWishlistButtons();

  // Render the wishlist grid only if we're on wishlist.html
  renderWishlistPage();
});
