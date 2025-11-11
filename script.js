:root{
  --bg:#0c0b0f; --surface:#121217; --card:#16161c; --panel:#14141a;
  --line:#1e1e25; --line-2:#2a2a33;
  --text:#ffffff; --muted:#a9adc0;
  --accent:#ff2b45; --accent-600:#ff425e;
  --shadow:0 10px 30px rgba(0,0,0,.35);
}

*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{font:inherit}

/* Header */
.topbar{
  position:sticky;top:0;z-index:40;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:14px 5%;background:var(--surface);border-bottom:1px solid var(--line)
}
.brand{display:flex;align-items:center;font-family:Orbitron,Inter,sans-serif;font-weight:800;letter-spacing:.04em}
.logo{display:inline-block;margin-right:6px}
.accent{color:var(--accent)}
.nav{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.nav a{color:var(--muted);padding:6px 2px;border-radius:8px;transition:color .2s,background .2s}
.nav a:hover,.nav a.active{color:#fff}
.cart-btn{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:transparent;color:#fff;padding:8px 12px;border-radius:10px;font-weight:700;cursor:pointer}
.cart-btn:hover{background:var(--accent);border-color:var(--accent)}
.badge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--accent);color:#fff;font-size:.72rem;font-weight:800}

/* HERO with background image */
.hero--sale{
  position:relative; z-index:0; border-bottom:1px solid var(--line);
  background:
    radial-gradient(900px 420px at 70% 10%, rgba(255,43,69,.08), transparent 60%),
    radial-gradient(700px 380px at 20% -10%, rgba(255,43,69,.06), transparent 60%),
    linear-gradient(180deg, rgba(12,11,15,.86) 0%, rgba(12,11,15,.70) 45%, rgba(12,11,15,.92) 100%),
    url("/Taco_Tuesday.webp");
  background-size:cover; background-position:center 40%;
}
.hero__wrap{width:90%;max-width:1200px;margin:0 auto;padding:48px 0 34px}
.hero--sale h1{font-family:Orbitron,Inter,sans-serif;letter-spacing:.02em;margin:0 0 6px}
.hero__sub{color:var(--muted);margin:0 0 16px}

.countdown{
  display:flex;gap:24px;flex-wrap:wrap;align-items:center;justify-content:space-between;
  background:#111219;border:1px solid var(--line);border-radius:14px;padding:16px
}
.sale-chip{display:inline-block;padding:6px 12px;border-radius:999px;background:var(--accent);color:#fff;font-weight:800;letter-spacing:.4px}
.timer{font:800 36px/1.1 Orbitron,Inter,sans-serif;margin-top:6px}
.tiny{color:#8b8fa3;font-size:.85rem;margin-top:4px}

.trustlist{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.trustlist li{color:#cdd1e6;font-weight:600}

/* Layout */
.container{width:90%;max-width:1200px;margin:0 auto 90px}
.toolbar{display:flex;align-items:center;gap:12px;margin:22px 0 18px}
.shop-sort{display:flex;align-items:center;gap:8px;color:var(--muted)}
.shop-sort select{background:#101014;color:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 10px}

/* Grid & Cards */
.grid{display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.card{
  position:relative;display:flex;flex-direction:column;gap:10px;padding:16px;background:var(--card);
  border:1px solid var(--line);border-radius:14px;transition:transform .15s ease,border-color .2s,box-shadow .2s;
  overflow:hidden; isolation:isolate;
}
.card:hover{transform:translateY(-3px);border-color:var(--line-2);box-shadow:0 0 18px rgba(255,43,69,.16)}
.card h3{margin:6px 0 0;font-size:1.05rem}

.flag{
  position:absolute;top:10px;left:10px;padding:5px 8px;border-radius:8px;font-size:.72rem;font-weight:800;
  color:#fff;background:var(--accent);z-index:2;box-shadow:0 0 12px rgba(255,43,69,.28)
}
.flag--sale{background:linear-gradient(90deg,#ff2b45,#ff5e76)}

.thumb-wrap{position:relative;border-radius:12px;overflow:hidden}
.thumb{
  width:100%;height:220px;object-fit:contain;object-position:center;border-radius:12px;
  border:1px solid var(--line);background:#0f0f14;margin-bottom:10px
}

.speed{margin:2px 0 8px;color:var(--muted);font-size:.95rem}

/* Variants */
.variant{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
.variant label{
  display:flex;align-items:center;gap:6px;background:#101014;border:1px solid var(--line);
  padding:6px 10px;border-radius:10px;cursor:pointer
}
.variant input{accent-color:var(--accent)}

/* Qty + Price */
.qty{display:flex;align-items:center;gap:6px}
.qty__btn{width:30px;height:30px;border-radius:8px;cursor:pointer;border:1px solid var(--line);background:#111;color:#fff}
.qty__input{width:52px;height:30px;border-radius:8px;text-align:center;color:#fff;background:#101014;border:1px solid var(--line);outline:none}

.price{font-weight:800;font-size:1.05rem;margin-top:6px}
.price .was{color:#8b8fa3;margin-right:8px;text-decoration:line-through}
.price .now{font-weight:800}

/* Actions */
.actions{display:flex;gap:10px;margin-top:2px}
.actions .btn{width:100%}
.btn{
  border:none;border-radius:10px;padding:10px 0;font-weight:800;cursor:pointer;
  transition:background .2s,transform .08s,box-shadow .2s;font-size:.86rem
}
.btn--ghost{background:transparent;border:1px solid var(--line);color:#fff}
.btn--ghost:hover{background:var(--line)}
.btn.buy{background:var(--accent);color:#fff;box-shadow:0 0 14px rgba(255,43,69,.22)}
.btn.buy:hover{background:var(--accent-600)}
.btn:active{transform:translateY(1px)}

/* Drawer */
.drawer{position:fixed;inset:0 0 0 auto;width:100%;max-width:420px;translate:100% 0;transition:translate .22s ease;z-index:60}
.drawer.open{translate:0 0}
.drawer__panel{height:100%;background:var(--panel);border-left:1px solid var(--line);display:flex;flex-direction:column}
.drawer__top{display:flex;align-items:center;justify-content:space-between;padding:14px;border-bottom:1px solid var(--line)}
.drawer__close{background:transparent;border:1px solid var(--line);color:#fff;border-radius:8px;width:34px;height:34px;cursor:pointer}
.drawer__body{padding:14px;flex:1;overflow:auto}
.drawer__bottom{padding:14px;border-top:1px solid var(--line)}
.drawer__total{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}

/* Quality Strip */
.quality{
  width:90%;max-width:1200px;margin:18px auto 80px;
  display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px
}
.quality__item{background:#101014;border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:700}

/* Footer */
.footer{text-align:center;padding:38px 5%;border-top:1px solid var(--line);background:var(--surface);color:var(--muted);font-size:.92rem}
.footer-nav{margin-top:10px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.footer-nav a{color:#cdd1e6}
.footer-nav a:hover{color:#fff}

/* Responsive */
@media (max-width:900px){
  .hero--sale .hero__wrap{padding:40px 0 28px}
}
@media (max-width:640px){
  .container{width:92%}
  .grid{gap:18px}
  .thumb{height:210px}
  .timer{font-size:30px}
}
