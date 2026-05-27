// ─────────────────────────────────────────────────────────────
//  auth.js  —  Stryde Authentication Logic
//
//  Handles:
//    - Input validation (empty fields, email format, pw match)
//    - Password visibility toggle
//    - Password strength meter (signup only)
//    - Signup: store user in localStorage
//    - Login:  check credentials against localStorage
//    - UI feedback: per-field errors + top-level alert banner
//
//  localStorage key: "stryde-users"  →  array of user objects
//  Each user: { name, email, password }
// ─────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════
//  SHARED UTILITIES
// ══════════════════════════════════════════════

/* ---------- localStorage helpers ---------- */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("http://localhost:8080/StrydeBackend/LoginServlet", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {

        localStorage.setItem("stryde-current-user", JSON.stringify({
          name: data.name,
          email: email
        }));

        window.location.href = "index.html";

      } else {
        alert("Invalid email or password");
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      alert("Server error. Check backend.");
    });
  });
}

/* ---------- Show / hide the top alert banner ---------- */

function showAlert(message, type) {
  // type: "error" | "success"
  var alert = document.getElementById('authAlert');
  if (!alert) return;

  alert.textContent = message;
  alert.className = 'auth-alert visible alert-' + type;
}

function hideAlert() {
  var alert = document.getElementById('authAlert');
  if (!alert) return;
  alert.className = 'auth-alert';
}

/* ---------- Show / clear a field-level error ---------- */

function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add('input-error');
  inputEl.classList.remove('input-success');
  errorEl.textContent = message;
  errorEl.classList.add('visible');
}

function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove('input-error');
  errorEl.classList.remove('visible');
}

function markFieldSuccess(inputEl) {
  inputEl.classList.remove('input-error');
  inputEl.classList.add('input-success');
}

/* ---------- Email format check ---------- */

function isValidEmail(email) {
  // Simple, readable regex: something@something.something
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- Password toggle (show / hide) ---------- */

function initPasswordToggle(toggleBtnId, inputId) {
  var btn   = document.getElementById(toggleBtnId);
  var input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', function () {
    var isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';

    // Swap icon: eye → eye-off  /  eye-off → eye
    btn.innerHTML = isHidden ? getEyeOffIcon() : getEyeIcon();
  });
}

function getEyeIcon() {
  return '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function getEyeOffIcon() {
  return '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
}


// ══════════════════════════════════════════════
//  SIGNUP PAGE
// ══════════════════════════════════════════════

function initSignup() {
  console.log("initSignup running");
  var form = document.getElementById('signupForm');
  if (!form) return; // not on signup page — stop here

  /* -- Wire password toggles -- */
  initPasswordToggle('togglePassword',        'password');
  initPasswordToggle('toggleConfirmPassword', 'confirmPassword');

  /* -- Password strength meter -- */
  var passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', function () {
      updateStrengthMeter(this.value);
    });
  }

  /* -- Clear field errors on typing -- */
  var fields = ['name', 'email', 'password', 'confirmPassword'];
  fields.forEach(function (id) {
    var input = document.getElementById(id);
    var error = document.getElementById(id + 'Error');
    if (input && error) {
      input.addEventListener('input', function () {
        clearFieldError(input, error);
        hideAlert();
      });
    }
  });

  /* -- Form submit -- */
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // stop default browser submit
    handleSignup();
  });
}

/* ---------- Validate + register the user ---------- */

function handleSignup() {
  // Grab DOM refs
  var nameInput    = document.getElementById('name');
  var emailInput   = document.getElementById('email');
  var pwInput      = document.getElementById('password');
  var confirmInput = document.getElementById('confirmPassword');

  var nameError    = document.getElementById('nameError');
  var emailError   = document.getElementById('emailError');
  var pwError      = document.getElementById('passwordError');
  var confirmError = document.getElementById('confirmPasswordError');

  var name     = nameInput.value.trim();
  var email    = emailInput.value.trim();
  var password = pwInput.value;
  var confirm  = confirmInput.value;

  var isValid = true;

  // Clear previous errors
  [nameInput, emailInput, pwInput, confirmInput].forEach(function (el) {
    el.classList.remove('input-error', 'input-success');
  });
  [nameError, emailError, pwError, confirmError].forEach(function (el) {
    el.classList.remove('visible');
  });
  hideAlert();

  /* -- Validate name -- */
  if (name === '') {
    showFieldError(nameInput, nameError, 'Please enter your full name.');
    isValid = false;
  } else {
    markFieldSuccess(nameInput);
  }

  /* -- Validate email -- */
  if (email === '') {
    showFieldError(emailInput, emailError, 'Please enter your email address.');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError(emailInput, emailError, 'Please enter a valid email (e.g. you@email.com).');
    isValid = false;
  } else {
    markFieldSuccess(emailInput);
  }

  /* -- Validate password -- */
  if (password === '') {
    showFieldError(pwInput, pwError, 'Please create a password.');
    isValid = false;

  } else if (
    password.length < 6 ||
    !/[a-z]/.test(password) ||     // lowercase
    !/[A-Z]/.test(password) ||     // uppercase
    !/[0-9]/.test(password) ||     // number
    !/[^A-Za-z0-9]/.test(password) // special char
  ) {
    showFieldError(
      pwInput,
      pwError,
      'Password must be 6+ characters and include lowercase, uppercase, number, and special character.'
    );
  isValid = false;
  
  } else {
    markFieldSuccess(pwInput);
  }

  /* -- Validate confirm password -- */
  if (confirm === '') {
    showFieldError(confirmInput, confirmError, 'Please confirm your password.');
    isValid = false;
  } else if (confirm !== password) {
    showFieldError(confirmInput, confirmError, 'Passwords do not match.');
    isValid = false;
  } else {
    markFieldSuccess(confirmInput);
  }

  if (!isValid) return; // stop if any field failed

  /* -- Save the new user -- */
  fetch("http://localhost:8080/StrydeBackend/SignupServlet", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: new URLSearchParams({
    name: name,
    email: email,
    password: password
  })
})
.then(res => res.json())
.then(data => {
  if (data.status === "success") {

    showAlert('Account created successfully! Redirecting…', 'success');

    var btn = document.getElementById('signupBtn');
    if (btn) {
      btn.classList.add('loading');
      btn.querySelector('span').textContent = 'Creating account…';
    }

  } else {
    showAlert('Signup failed. Try again.', 'error');
  }
});

  /* -- Success feedback then redirect -- */
  showAlert('Account created successfully! Redirecting to login…', 'success');

  var btn = document.getElementById('signupBtn');
  if (btn) {
    btn.classList.add('loading');
    btn.querySelector('span').textContent = 'Creating account…';
  }

  setTimeout(function () {
    window.location.href = 'login.html';
  }, 1600);
}

/* ---------- Password strength meter ---------- */

function updateStrengthMeter(password) {
  var wrap  = document.getElementById('strengthWrap');
  var fill  = document.getElementById('strengthFill');
  var label = document.getElementById('strengthLabel');
  if (!wrap || !fill || !label) return;

  if (password.length === 0) {
    wrap.classList.remove('visible');
    return;
  }

  wrap.classList.add('visible');

  // Score: one point per criterion
  var score = 0;
  if (password.length >= 6)              score++;  // minimum length
  if (password.length >= 10)             score++;  // longer
  if (/[A-Z]/.test(password))            score++;  // uppercase
  if (/[0-9]/.test(password))            score++;  // number
  if (/[^A-Za-z0-9]/.test(password))    score++;  // special char

  var levels = [
    { width: '20%',  color: '#e3000b', text: 'Weak' },
    { width: '40%',  color: '#e3000b', text: 'Weak' },
    { width: '60%',  color: '#f59e0b', text: 'Fair' },
    { width: '80%',  color: '#3b82f6', text: 'Good' },
    { width: '100%', color: '#1a7a3c', text: 'Strong' },
  ];

  var level = levels[score - 1] || levels[0];
  fill.style.width      = level.width;
  fill.style.background = level.color;
  label.textContent     = level.text;
  label.style.color     = level.color;
}


// ══════════════════════════════════════════════
//  LOGIN PAGE
// ══════════════════════════════════════════════

function initLogin() {
  var form = document.getElementById('loginForm');
  if (!form) return; // not on login page — stop here

  /* -- Wire password toggle -- */
  initPasswordToggle('togglePassword', 'password');

  /* -- Clear errors on typing -- */
  var fields = ['email', 'password'];
  fields.forEach(function (id) {
    var input = document.getElementById(id);
    var error = document.getElementById(id + 'Error');
    if (input && error) {
      input.addEventListener('input', function () {
        clearFieldError(input, error);
        hideAlert();
      });
    }
  });

  /* -- Form submit -- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    handleLogin();
  });
}

/* ---------- Validate + authenticate ---------- */

function handleLogin() {
  var emailInput = document.getElementById('email');
  var pwInput    = document.getElementById('password');
  var emailError = document.getElementById('emailError');
  var pwError    = document.getElementById('passwordError');

  var email    = emailInput.value.trim();
  var password = pwInput.value;

  var isValid = true;

  // Clear previous states
  [emailInput, pwInput].forEach(function (el) {
    el.classList.remove('input-error', 'input-success');
  });
  [emailError, pwError].forEach(function (el) {
    el.classList.remove('visible');
  });
  hideAlert();

  /* -- Validate email -- */
  if (email === '') {
    showFieldError(emailInput, emailError, 'Please enter your email address.');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError(emailInput, emailError, 'Please enter a valid email address.');
    isValid = false;
  } else {
    markFieldSuccess(emailInput);
  }

  /* -- Validate password -- */
  if (password === '') {
    showFieldError(pwInput, pwError, 'Please enter your password.');
    isValid = false;
  } else {
    markFieldSuccess(pwInput);
  }

  if (!isValid) return;

  /* -- Check credentials against localStorage -- */
  var users = getUsers();
  var matchedUser = users.find(function (u) {
    return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
  });

  if (!matchedUser) {
    // Wrong email or password — keep inputs clean, show banner
    showAlert('Incorrect email or password. Please try again.', 'error');
    pwInput.classList.add('input-error');
    return;
  }

  /* -- Success -- */
  showAlert('Welcome back, ' + matchedUser.name + '! Redirecting…', 'success');

  var btn = document.getElementById('loginBtn');
  if (btn) {
    btn.classList.add('loading');
    btn.querySelector('span').textContent = 'Logging in…';
  }

  // Save logged-in user session
  localStorage.setItem('stryde-current-user', JSON.stringify(matchedUser));
  localStorage.setItem("userLoggedIn", "true");

  setTimeout(function () {
    window.location.href = 'index.html';
  }, 1600);
}


// ══════════════════════════════════════════════
//  BOOT — run whichever page we're on
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  initSignup(); // runs only if signupForm exists
  initLogin();  // runs only if loginForm exists
});

const user = JSON.parse(localStorage.getItem("stryde-current-user"));

if (user && user.name) {
  fields.fullName.value = user.name;
}
