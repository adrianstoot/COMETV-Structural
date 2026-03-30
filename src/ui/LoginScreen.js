/**
 * LoginScreen v3.0 — Premium modal with polished dark design.
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
          <div class="login-logo">CS</div>
          <div class="login-title">COMETV</div>
          <div class="login-subtitle">STRUCTURAL DESIGN</div>
        </div>
        <p class="login-tagline">Editor paramétrico de estructuras metálicas · Eurocódigo 3</p>

        <form id="login-form" autocomplete="off">
          <div class="login-field">
            <label>USUARIO</label>
            <input type="text" id="login-user" placeholder="Nombre de usuario" value="Ingeniero" autocomplete="off" spellcheck="false">
          </div>
          <div class="login-field">
            <label>CONTRASEÑA</label>
            <input type="password" id="login-pass" placeholder="••••••" autocomplete="new-password">
          </div>
          <div id="login-error" style="height:16px;font-size:10px;color:var(--danger);text-align:center;margin:4px 0"></div>
          <button type="submit" class="login-submit">
            <i class="fa-solid fa-right-to-bracket" style="margin-right:7px"></i>ACCEDER AL EDITOR
          </button>
        </form>

        <div class="login-footer">
          COMETV Structural v3.0 PRO · EN 1993 / CTE DB SE-A
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = document.getElementById('login-pass').value;
      const user = document.getElementById('login-user').value.trim() || 'Usuario';

      if (pass === '4444' || pass === '' || pass.length >= 0) {
        // Accept any password for demo — remove restriction in prod
        overlay.classList.add('login-fade-out');
        setTimeout(() => {
          overlay.remove();
          if (this.onSuccess) this.onSuccess(user);
        }, 380);
      } else {
        const err = document.getElementById('login-error');
        err.textContent = 'Contraseña incorrecta';
        const passEl = document.getElementById('login-pass');
        passEl.value = '';
        passEl.focus();
        passEl.style.borderColor = 'var(--danger)';
        passEl.style.boxShadow = '0 0 0 3px rgba(242,87,87,0.15)';
        setTimeout(() => {
          passEl.style.borderColor = '';
          passEl.style.boxShadow = '';
          err.textContent = '';
        }, 2000);
      }
    });

    setTimeout(() => document.getElementById('login-pass')?.focus(), 120);
  }
}
