const API_BASE = '';

function showMessage(message, type = 'error') {
  const box = document.getElementById('formMessage');
  if (!box) return;
  box.textContent = message;
  box.className = `form-message ${type}`;
}

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    button.textContent = visible ? 'Show' : 'Hide';
    button.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  });
});

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    const form = new FormData(signupForm);
    const payload = Object.fromEntries(form.entries());
    payload.terms = document.getElementById('terms').checked;

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create your account.');

      showMessage(`Account created. Your username is ${data.username}. Redirecting to login...`, 'success');
      signupForm.reset();
      setTimeout(() => {
        window.location.href = `login.html?username=${encodeURIComponent(data.username)}`;
      }, 1800);
    } catch (error) {
      showMessage(error.message);
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const params = new URLSearchParams(window.location.search);
  const savedUsername = params.get('username');
  if (savedUsername) document.getElementById('username').value = savedUsername;

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    const form = new FormData(loginForm);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed.');

      showMessage(`Welcome back, ${data.user.name}.`, 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 900);
    } catch (error) {
      showMessage(error.message);
    }
  });
}
