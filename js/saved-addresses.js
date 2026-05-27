(function () {

  const form =
    document.getElementById('addressForm');

  const grid =
    document.getElementById('addressesGrid');

  const empty =
    document.getElementById('addressesEmpty');

  const alertBox =
    document.getElementById('addressAlert');

  const user =
    JSON.parse(localStorage.getItem('stryde-current-user'));

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // ─────────────────────────────
  // SHOW ALERT
  // ─────────────────────────────
  function showAlert(message, type) {

    alertBox.textContent = message;

    alertBox.className =
      'form-alert visible alert-' + type;

    setTimeout(function () {
      alertBox.classList.remove('visible');
    }, 3000);
  }

  // ─────────────────────────────
  // LOAD ADDRESSES
  // ─────────────────────────────
  async function loadAddresses() {

    try {

      const response = await fetch(
        'http://localhost:8080/StrydeBackend/GetAddressesServlet?email='
        + encodeURIComponent(user.email)
      );

      const addresses = await response.json();

      grid.innerHTML = '';

      if (!addresses.length) {
        empty.style.display = 'block';
        return;
      }

      empty.style.display = 'none';

      addresses.forEach(function(address) {

        const card = document.createElement('div');

        card.className = 'address-card';

        card.innerHTML = `
          <div class="address-card-name">
            ${address.fullName}
          </div>

          <div class="address-card-phone">
            ${address.phone}
          </div>

          <div class="address-card-line">
            ${address.addressLine}<br>
            ${address.city}, ${address.state}<br>
            ${address.pincode}
          </div>
        `;

        grid.appendChild(card);

      });

    } catch (err) {

      console.error(err);

      showAlert('Failed to load addresses', 'error');

    }
  }

  // ─────────────────────────────
  // SAVE ADDRESS
  // ─────────────────────────────
  form.addEventListener('submit', async function(e) {

    e.preventDefault();

    const payload = {

      userEmail: user.email,

      fullName:
        document.getElementById('fullName').value.trim(),

      phone:
        document.getElementById('phone').value.trim(),

      addressLine:
        document.getElementById('addressLine').value.trim(),

      city:
        document.getElementById('city').value.trim(),

      state:
        document.getElementById('state').value.trim(),

      pincode:
        document.getElementById('pincode').value.trim()
    };

    try {

      const response = await fetch(
        'http://localhost:8080/StrydeBackend/SaveAddressServlet',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {

        showAlert('Address saved!', 'success');

        form.reset();

        loadAddresses();

      } else {

        showAlert(data.message || 'Save failed', 'error');

      }

    } catch (err) {

      console.error(err);

      showAlert('Server error', 'error');

    }

  });

  // ─────────────────────────────
  // INIT
  // ─────────────────────────────
  loadAddresses();

})();