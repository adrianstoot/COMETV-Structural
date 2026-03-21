/**
 * LoginScreen — Modal login with password authentication.
 */
export class LoginScreen {
  constructor(onSuccess) {
    this.onSuccess = onSuccess;
    this._render();
  }

  _render() {
    const overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.innerHTML = `
      <div class="login-card">
        <div class="login-brand">
          <div class="login-logo">C</div>
          <div class="login-title">COMETV</div>
          <div class="login-subtitle">STRUCTURAL DESIGN</div>
        </div>
        <div class="login-desc">Software de diseño de estructuras metálicas</div>
        <form id="login-form" autocomplete="off">
          <div class="login-field">
            <label>Usuario</label>
            <input type="text" id="login-user" placeholder="Ingrese su usuario" value="Ingeniero" autocomplete="off">
          </div>
          <div class="login-field">
            <label>Contraseña</label>
            <input type="password" id="login-pass" placeholder="••••" autocomplete="off">
          </div>
          <div id="login-error" class="login-error"></div>
          <button type="submit" class="login-btn">
            <i class="fa-solid fa-right-to-bracket"></i> Acceder
          </button>
        </form>
        <div class="login-footer">
          <span>v2.0</span> · <span>Eurocódigo 3 / CTE DB SE-A</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = document.getElementById('login-pass').value;
      const user = document.getElementById('login-user').value.trim();
      if (pass === '4444') {
        overlay.classList.add('login-fade-out');
        setTimeout(() => {
          overlay.remove();
          if (this.onSuccess) this.onSuccess(user);
        }, 400);
      } else {
        const err = document.getElementById('login-error');
        err.textContent = 'Contraseña incorrecta';
        document.getElementById('login-pass').value = '';
        document.getElementById('login-pass').focus();
        err.classList.add('shake');
        setTimeout(() => err.classList.remove('shake'), 500);
      }
    });

    setTimeout(() => document.getElementById('login-pass').focus(), 100);
  }
}
