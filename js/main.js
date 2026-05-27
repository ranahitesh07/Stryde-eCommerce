    const navbar      = document.getElementById('navbar');
    const searchBtn   = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchWrap  = document.getElementById('searchWrapper');
    const hamburger   = document.getElementById('hamburger');
    const drawer      = document.getElementById('mobileDrawer');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const wishlistLink = document.getElementById("wishlistLink");

    /* Sticky shadow */
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
 
    /* Search expand */
    let searchOpen = false;
    searchBtn.addEventListener('click', () => {
      searchOpen = !searchOpen;
      searchWrap.classList.toggle('open', searchOpen);
      searchBtn.setAttribute('aria-expanded', searchOpen);
      if (searchOpen) {
        setTimeout(() => searchInput.focus(), 320);
      } else {
        searchInput.value = '';
        searchInput.blur();
      }
    });
 
    /* Close search on outside click */
    document.addEventListener('click', (e) => {
      if (searchOpen && !searchWrap.contains(e.target)) {
        searchOpen = false;
        searchWrap.classList.remove('open');
        searchBtn.setAttribute('aria-expanded', 'false');
        searchInput.value = '';
      }
    });
 
    /* Mobile menu toggle */
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      drawer.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      drawer.setAttribute('aria-hidden', !isOpen);
    });
 
    /* Close drawer on nav link click */
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      });
    });

  function updateProfileDropdown() {
  const userData = localStorage.getItem("stryde-current-user");

  const greeting      = document.getElementById("userGreeting");
  const loginLink     = document.getElementById("loginLink");
  const ordersLink    = document.getElementById("ordersLink");
  const wishlistLink  = document.getElementById("wishlistLink");
  const logoutLink    = document.getElementById("logoutLink");

  if (!loginLink) return;

  if (userData) {
    const user = JSON.parse(userData);

    // Logged in
    if (greeting) {
      greeting.textContent = `Hi, ${user.name}`;
      greeting.style.display = "block";
    }

    loginLink.style.display = "none";
    ordersLink.style.display = "block";
    wishlistLink.style.display = "block";
    logoutLink.style.display = "block";

  } else {
    // Not logged in
    if (greeting) greeting.style.display = "none";

    loginLink.style.display = "block";
    ordersLink.style.display = "none";
    wishlistLink.style.display = "none";
    logoutLink.style.display = "none";
  }
}

  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
    profileDropdown.classList.toggle('show');
  });
}

    /* Close when clicking outside */
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    /* Filter pill interaction */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });


  /* Color swatch swap */
  document.querySelectorAll('.card-swatches').forEach(group => {
    group.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        group.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      });
    });
  });

  // ─────────────────────────────────────────────
//  STRYDE — Cart System
//  Stores cart in localStorage, syncs badge count
// ─────────────────────────────────────────────


// ── 1. Core helpers ───────────────────────────

/**
 * Read the cart array from localStorage.
 * Returns an empty array if nothing is stored yet.
 */
function getCart() {
  const stored = localStorage.getItem('stryde-cart');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save the cart array back to localStorage.
 */
function saveCart(cart) {
  localStorage.setItem('stryde-cart', JSON.stringify(cart));
}


// ── 2. Add a product to the cart ─────────────

/**
 * Adds one unit of a product.
 * If the product already exists (matched by name),
 * its quantity is increased by 1 instead of creating a duplicate.
 */
function addToCart(name, price, image) {
  const cart = getCart();

  // Check if this product is already in the cart
  const existingItem = cart.find(function(item) {
    return item.name === name;
  });

  if (existingItem) {
    // Product already exists — just bump the quantity
    existingItem.quantity += 1;
  } else {
    // New product — push a fresh entry
    cart.push({
      name:     name,
      price:    price,   // stored as a number (no ₹ symbol)
      image:    image,
      quantity: 1
    });
  }

  saveCart(cart);
}


// ── 3. Count total items in the cart ─────────

/**
 * Adds up quantity across all cart items.
 * e.g. 2 tees + 1 hoodie = 3
 */
function getTotalCount() {
  const cart = getCart();
  return cart.reduce(function(total, item) {
    return total + item.quantity;
  }, 0);
}


// ── 4. Update the navbar badge ────────────────

/**
 * Finds the .cart-badge element in the navbar
 * and sets its text to the current total item count.
 * Hides the badge if the cart is empty.
 */
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return; // safety: badge not found in DOM

  const count = getTotalCount();

  badge.textContent = count;

  // Hide badge when cart is empty, show when it has items
  badge.style.display = count > 0 ? 'flex' : 'none';
}


// ── 5. Button feedback animation ─────────────

/**
 * Briefly changes the button text to "Added ✓"
 * then restores it — no CSS needed, JS only.
 */
function showAddedFeedback(button) {
  const originalText = button.textContent;

  button.textContent  = 'Added ✓';
  button.disabled     = true;   // prevent double-clicks during feedback

  setTimeout(function() {
    button.textContent = originalText;
    button.disabled    = false;
  }, 1200);
}


// ── 6. Attach click listeners to all Quick Add buttons ──

/**
 * Loops over every .quick-add-btn on the page,
 * reads its data-* attributes, and wires up the click.
 */
function initCart() {
  const buttons = document.querySelectorAll('.quick-add-btn');

  buttons.forEach(function(button) {
    button.addEventListener('click', function() {
      // Read product info from the button's data attributes
      const name  = button.getAttribute('data-name');
      const price = Number(button.getAttribute('data-price')); // convert to number
      const image = button.getAttribute('data-image');

      // Guard: skip if any data attribute is missing
      if (!name || !price || !image) {
        console.warn('Quick Add button is missing data attributes:', button);
        return;
      }

      // Add to cart, update badge, show feedback
      addToCart(name, price, image);
      updateCartBadge();
      showAddedFeedback(button);
    });
  });
}


// ── 7. Run on page load ───────────────────────

/**
 * On every page load:
 * 1. Sync the badge with whatever is already in localStorage
 * 2. Wire up all Quick Add buttons
 */
document.addEventListener('DOMContentLoaded', function() {
  updateCartBadge();  // restore badge count after refresh
  initCart();         // attach button listeners
});


const logoutLink = document.getElementById("logoutLink");

if (logoutLink) {
  logoutLink.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("stryde-current-user");
    location.reload();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  updateProfileDropdown();
});

const user = JSON.parse(localStorage.getItem("stryde-current-user"));