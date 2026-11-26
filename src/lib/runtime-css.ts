/** The one stylesheet for the carousel. The live preview injects it; exports ship it unchanged. */
export const RUNTIME_CSS = `.mf-root{--mf-stage:#222d34;--mf-r:14px;--u:10px;--mf-ts:1;--mf-ov:.82;--mf-br:1;--mf-vig:0;--mf-accent:#69daba;--mf-font:Inter,"DM Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative;display:block;box-sizing:border-box;width:100%;aspect-ratio:var(--mf-ratio,16/9);min-height:240px;overflow:hidden;border-radius:var(--mf-r);background:var(--mf-stage);color:#f6f5ef;font-family:var(--mf-font);isolation:isolate;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:0}
.mf-root.mf-f-serif{--mf-font:Georgia,"Times New Roman",ui-serif,serif}
.mf-root.mf-f-mono{--mf-font:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.mf-root.mf-drag{cursor:grab}
.mf-root.is-dragging{cursor:grabbing}
.mf-root:focus-visible{outline:2px solid #68ddb8;outline-offset:3px}
.mf-root *{box-sizing:border-box}
.mf-viewport{position:absolute;inset:0;overflow:hidden;perspective:1200px}
.mf-stage{position:absolute;inset:0;transform-style:preserve-3d}
.mf-card{position:absolute;left:0;top:0;overflow:hidden;border-radius:var(--mf-r);background:#2a3640;box-shadow:var(--mf-shadow,none);backface-visibility:hidden;-webkit-backface-visibility:hidden;will-change:transform,opacity;transition:box-shadow .45s ease}
.mf-root.bf-on .mf-card{backface-visibility:visible;-webkit-backface-visibility:visible}
.mf-card.is-active{box-shadow:var(--mf-shadow-a,var(--mf-shadow,none))}
.mf-root.has-border .mf-card{outline:1px solid rgba(255,255,255,.18);outline-offset:-1px}
.mf-root.has-sheen .mf-card::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.18),transparent 38%)}
.mf-bg{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat;filter:brightness(var(--mf-br,1));will-change:transform}
.mf-root.no-image .mf-bg{background-image:none!important}
.mf-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(0deg,rgba(8,13,15,var(--mf-ov,.82)),rgba(8,13,15,.04) 75%)}
.mf-card:not([data-img]) .mf-shade{opacity:.35}
.mf-root.no-overlay .mf-shade{display:none}
.mf-copy{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:calc(var(--u)*1.1);padding:max(8px,clamp(calc(var(--ft,26px)*.7),calc(var(--u)*5),64px));pointer-events:none;text-align:left}
.mf-card[data-v=top] .mf-copy{justify-content:flex-start}
.mf-card[data-v=center] .mf-copy{justify-content:center}
.mf-card[data-a=center] .mf-copy{align-items:center;text-align:center}
.mf-card[data-a=end] .mf-copy{align-items:flex-end;text-align:right}
.mf-eyebrow{display:flex;align-items:center;gap:.6em;font-size:clamp(calc(var(--fb,11px)*.75),calc(var(--u)*1.05),12px);font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(246,245,239,.82)}
.mf-eyebrow i{width:2.4em;height:1px;background:currentColor;opacity:.7}
.mf-copy h2{margin:0;max-width:16ch;font-size:clamp(var(--ft,26px),calc(var(--u)*6.4*var(--mf-ts)),96px);line-height:.98;font-weight:700;letter-spacing:-.045em;text-wrap:balance;text-shadow:0 2px 22px rgba(0,0,0,.28)}
.mf-f-serif .mf-copy h2{font-weight:600;letter-spacing:-.02em}
.mf-f-mono .mf-copy h2{font-weight:600;letter-spacing:-.06em}
.mf-copy p{margin:0;max-width:34ch;font-size:clamp(var(--fb,11px),calc(var(--u)*1.45),16px);line-height:1.5;color:rgba(246,245,239,.84)}
.mf-cta{pointer-events:auto;display:inline-flex;align-items:center;margin-top:calc(var(--u)*.6);padding:.7em 1.2em;border-radius:999px;border:1px solid rgba(255,255,255,.4);background:rgba(10,16,15,.34);color:#f6f5ef;font-size:clamp(var(--fb,11px),calc(var(--u)*1.3),14px);font-weight:600;text-decoration:none;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .2s,border-color .2s}
.mf-cta:hover{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.7)}
.mf-cta:focus-visible{outline:2px solid #68ddb8;outline-offset:2px}
.mf-root.no-eyebrow .mf-eyebrow,.mf-root.no-title h2,.mf-root.no-body .mf-copy p,.mf-root.no-cta .mf-cta,.mf-root.no-index .mf-index{display:none}
.mf-index{position:absolute;top:clamp(14px,calc(var(--u)*3),32px);right:clamp(14px,calc(var(--u)*3),32px);z-index:1;font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:rgba(246,245,239,.9)}
.mf-index i{font-style:normal;opacity:.55}
.mf-nav{position:absolute;inset:0;z-index:40;pointer-events:none}
.mf-bar{position:absolute;left:18px;right:18px;bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.mf-nav[data-pos=center] .mf-bar{justify-content:center;flex-direction:column;gap:6px}
.mf-left,.mf-arrows{display:flex;align-items:center;gap:8px;pointer-events:auto}
.mf-nav .mf-sides{position:absolute;left:12px;right:12px;top:50%;transform:translateY(-50%);justify-content:space-between;pointer-events:none}
.mf-sides .mf-btn{pointer-events:auto}
.mf-btn{display:grid;place-items:center;min-width:42px;height:42px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.38);background:rgba(10,16,15,.45);color:#f6f5ef;font:600 16px/1 inherit;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .2s,opacity .2s,transform .2s}
.mf-btn:hover:not(:disabled){background:rgba(255,255,255,.2)}
.mf-btn:active:not(:disabled){transform:scale(.94)}
.mf-btn:disabled{opacity:.35;cursor:default}
.mf-btn:focus-visible,.mf-dot:focus-visible,.mf-thumb:focus-visible{outline:2px solid #68ddb8;outline-offset:2px}
.mf-play{font-size:12px;letter-spacing:.04em}
.mf-dots{display:flex;align-items:center}
.mf-dot{padding:19px 3px;border:0;background:none;cursor:pointer}
.mf-dot::before{content:"";display:block;width:18px;height:3px;border-radius:3px;background:rgba(233,238,233,.55);transition:width .28s,background .28s}
.mf-dot[aria-current=true]::before{width:36px;background:var(--mf-accent)}
.mf-thumbs{display:flex;gap:6px}
.mf-thumb{width:46px;height:34px;border-radius:6px;border:2px solid transparent;opacity:.65;cursor:pointer;transition:opacity .2s,border-color .2s}
.mf-thumb[aria-current=true]{opacity:1;border-color:var(--mf-accent)}
.mf-frac{font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;padding:0 6px;text-shadow:0 1px 8px rgba(0,0,0,.4)}
.mf-progress{position:absolute;left:0;right:0;bottom:0;height:3px;z-index:41;background:rgba(255,255,255,.16);pointer-events:none}
.mf-progress i{display:block;height:100%;width:100%;transform-origin:left center;transform:scaleX(0);background:var(--mf-accent)}
.mf-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.mf-root::after{content:"";position:absolute;inset:0;z-index:35;pointer-events:none;background:radial-gradient(ellipse at center,transparent 52%,rgba(0,0,0,var(--mf-vig,0)) 100%)}
.mf-root img,.mf-root a{-webkit-user-drag:none}
@media (max-width:560px){.mf-bar{left:12px;right:12px;bottom:10px}}
.mf-compact .mf-btn{min-width:34px;height:34px;padding:0 8px;font-size:13px}.mf-compact .mf-dot{padding:13px 3px}.mf-compact .mf-bar{left:10px;right:10px;bottom:6px}.mf-compact .mf-cta{display:none}.mf-compact .mf-copy p{display:none}
@media (prefers-reduced-motion:reduce){.mf-dot::before,.mf-card{transition:none}}
`;
