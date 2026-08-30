/**
 * Shared headed-review overlay — single source of truth for the on-screen UI
 * used by tests/e2e/review and tests/framework/review.
 *
 * - reviewBannerScript: top-left white chips (case label + progress + note)
 * - HUD: bottom-center dark pill (#e2e-hud, same look as the e2e fixtures'
 *   "Rendering · <case>" pill) with a draining hold progress bar.
 *
 * The HUD CSS mirrors the `#e2e-hud` block in tests/e2e/app/app.css — keep the
 * two in sync (the fixtures cannot import from here: app.css ships to Vite).
 */

export const reviewBannerScript = ({ label, progress, note }) => `(function(){
  document.title='▶ ${label} (${progress})';
  const old=document.getElementById('__bkoiBanner'); old&&old.remove();
  const b=document.createElement('div');
  b.id='__bkoiBanner';
  b.style.cssText='position:absolute;top:10px;left:12px;z-index:5;display:flex;gap:8px;align-items:center;font:600 13px/1.4 system-ui,sans-serif;color:#123;pointer-events:none';
  b.innerHTML='<span style="background:rgba(255,255,255,0.85);padding:3px 10px;border-radius:4px">${label}</span>' +
    '<span style="background:rgba(255,255,255,0.85);padding:3px 10px;border-radius:4px">${progress}</span>' +
    '<span style="background:rgba(255,255,255,0.9);padding:3px 10px;border-radius:4px;font-weight:400">👁 ${note}</span>';
  document.body.appendChild(b);
})()`

export const headedLaunch = { headless: false, args: ['--start-maximized'] }
export const headedContext = { viewport: null }

/** Exact #e2e-hud styles from tests/e2e/app/app.css (bottom-center pill). */
export const HUD_CSS = `
#e2e-hud{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:rgba(15,23,42,0.85);color:#f8fafc;font:500 12px/1 system-ui,sans-serif;letter-spacing:0.02em;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,0.3)}
#e2e-hud .dot{width:8px;height:8px;border-radius:50%;background:#34d399;animation:e2e-pulse 1.2s ease-in-out infinite}
@keyframes e2e-pulse{50%{opacity:0.35}}
#e2e-hud .hold{display:inline-flex;align-items:center;gap:8px}
#e2e-hud .bar{width:90px;height:4px;border-radius:2px;background:rgba(255,255,255,0.2);overflow:hidden}
#e2e-hud .bar i{display:block;height:100%;border-radius:2px;background:#34d399}
`

/** Inject the HUD stylesheet + pill: green pulsing dot + "Rendering · <label>". */
export const mountHudScript = ({ label }) => `(function(){
  if (document.getElementById('e2e-hud-style')) return;
  const st = document.createElement('style');
  st.id = 'e2e-hud-style';
  st.textContent = \`${HUD_CSS}\`;
  document.head.appendChild(st);
  if (document.getElementById('e2e-hud')) return;
  const el = document.createElement('div');
  el.id = 'e2e-hud';
  el.innerHTML = '<span class="dot"></span><span class="label"></span><span class="hold"></span>';
  el.querySelector('.label').textContent = 'Rendering · ${label}';
  document.body.appendChild(el);
})()`

/** Headed hold: the bar drains over ms, then the pill goes away (fixture parity). */
export const hudHoldScript = (ms) => `(function(){
  const el = document.getElementById('e2e-hud');
  const hold = el && el.querySelector('.hold');
  if (!hold) return;
  hold.innerHTML = '<span class="bar"><i></i></span>';
  const bar = hold.querySelector('.bar i');
  const t0 = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      const left = Math.max(0, ${ms} - (performance.now() - t0));
      if (bar) bar.style.width = (left / ${ms}) * 100 + '%';
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }).then(() => el && el.remove());
})()`
