// ─────────────────────────────────────────────────────────────
//  profile.js  —  Stryde Profile Page
//
//  What this file does:
//    1. Read the logged-in user from localStorage
//    2. Redirect to login.html if nobody is logged in
//    3. Fill the greeting, name, email, and avatar on the page
//    4. Handle the Logout button
//    5. Sync the cart badge in the navbar
//
//  localStorage key used:
//    "stryde-current-user"  →  { name: "Hitesh", email: "..." }
//    Set by your Java Servlet after a successful login.
//
//  Does NOT touch: stryde-cart, stryde-users, or any other key.
// ─────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════
//  STEP 1 — Read the current user
// ══════════════════════════════════════════════

/*
  getCurrentUser()
  ----------------
  Reads "stryde-current-user" from localStorage and
  returns it as a JavaScript object.
  Returns null if no user is logged in.
*/
function getCurrentUser() {
  var stored = localStorage.getItem('stryde-current-user');

  // If nothing stored, return null (not logged in)
  if (!stored) {
    return null;
  }

  // Parse the JSON string back into an object
  return JSON.parse(stored);
}


// ══════════════════════════════════════════════
//  STEP 2 — Fill the page with user data
// ══════════════════════════════════════════════

/*
  loadProfile()
  -------------
  Called once on page load.
  1. Gets the user from localStorage.
  2. If no user → redirect to login.html immediately.
  3. If user found → fill in all the display elements.
*/
function loadProfile() {
  var user = getCurrentUser();

  // ── Guard: not logged in ──
  if (!user) {
    // Send the visitor to the login page right away
    window.location.href = 'login.html';
    return; // stop — don't run the rest of this function
  }

  // ── We have a user — fill the UI ──

  var name  = user.name  || 'Member';
  var email = user.email || '';

  // "Hi, Hitesh"
  var greetingEl = document.getElementById('profileGreeting');
  if (greetingEl) {
    greetingEl.textContent = 'Hi, ' + name.split(' ')[0]; // first name only
  }

  // Full name in the big heading
  var nameEl = document.getElementById('profileName');
  if (nameEl) {
    nameEl.textContent = name;
  }

  // Email below the name
  var emailEl = document.getElementById('profileEmail');
  if (emailEl) {
    emailEl.textContent = email;
  }

  // Avatar initials (first letter of the name)
  var avatarEl = document.getElementById('profileAvatar');
  if (avatarEl) {
    avatarEl.textContent = name.charAt(0).toUpperCase();
  }
}


// ══════════════════════════════════════════════
//  STEP 3 — Logout button
// ══════════════════════════════════════════════

/*
  initLogout()
  ------------
  Finds the logout button and wires up its click event.
  On click:
    1. Remove "stryde-current-user" from localStorage.
       (This does NOT delete the cart or other data.)
    2. Redirect the user to index.html.
*/
function initLogout() {
  var logoutBtn = document.getElementById('logoutBtn');

  // Safety check
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', function () {
    // Remove session only
    localStorage.removeItem('stryde-current-user');

    // Show toast if available
    if (typeof showToast === "function") {
      showToast("Logged out");
    }

    // Redirect after delay
    setTimeout(function () {
      window.location.href = 'index.html';
    }, 800);
  });
}


// ══════════════════════════════════════════════
//  STEP 4 — Sync the cart badge in the navbar
// ══════════════════════════════════════════════

/*
  syncCartBadge()
  ---------------
  Reads stryde-cart and updates the little number on
  the cart icon so it stays accurate on this page too.
*/
function syncCartBadge() {
  // If global function exists, use it
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
    return;
  }

  // Fallback logic (your original code)
  var badge = document.querySelector('.cart-badge');
  if (!badge) return;

  var cart = JSON.parse(localStorage.getItem('stryde-cart') || '[]');

  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    total += cart[i].quantity;
  }

  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}


// ══════════════════════════════════════════════
//  STEP 5 — Run everything when page is ready
// ══════════════════════════════════════════════

/*
  DOMContentLoaded fires once the HTML has fully loaded.
  We wait for it so we can safely access DOM elements.
*/
document.addEventListener('DOMContentLoaded', function () {
  loadProfile();    // fill user info (or redirect to login)
  initLogout();     // wire up the logout button
  syncCartBadge();  // update the cart number in the navbar
});
