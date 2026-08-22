// ============================================================
//  กล่องสุ่มรางวัล — app.js (Unified Single-Box Edition)
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx580dyPfzslsut-QGtLrRHCt0Hdv9AscR3OfZF0ZTKYKfKETTKF9DAI7e6wXyhEvYlBw/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

const LB_CONFIG = [
  { milestone: 7,  name: 'กล่องเงิน',      tier: 'silver', ms: 'ms-silver' },
  { milestone: 14, name: 'กล่องทอง',        tier: 'gold',   ms: 'ms-gold'   },
  { milestone: 21, name: 'กล่องแพลตินัม',   tier: 'plat',   ms: 'ms-plat'   },
  { milestone: 28, name: 'กล่องตำนาน',      tier: 'legend', ms: 'ms-legend' },
];

const TIER_CFG = {
  paid: {
    color: '#C084FC', label: 'PAID BONUS',
    capsuleBottom: 'linear-gradient(160deg,#F5D0FE,#C084FC 55%,#7C3AED)',
    holo: true,
    tensionMs: 2600,
    badge:{ bg:'linear-gradient(145deg,#1e0a2e,#120618)', border:'rgba(232,121,249,.4)', glow:'rgba(192,132,252,.35)' },
    badgeGrad: 'linear-gradient(160deg,#fdf4ff,#E879F9 45%,#7e22ce)',
    btn:{ bg:'linear-gradient(135deg,#E879F9 0%,#A855F7 100%)', color:'#1a0030', glow:'rgba(232,121,249,.5)' },
    confetti: ['#E879F9','#C084FC','#fff'],
  },
  silver: {
    color: '#94A3B8', label: 'SILVER RANK',
    capsuleBottom: 'linear-gradient(160deg,#E2E8F0,#94A3B8 55%,#475569)',
    tensionMs: 1700,
    badge:{ bg:'linear-gradient(145deg,#0a1a2a,#040c14)', border:'rgba(147,210,255,.5)', glow:'rgba(147,210,255,.4)' },
    badgeGrad: 'linear-gradient(160deg,#f0f8ff,#93D2FF 45%,#1a5f8a)',
    btn:{ bg:'linear-gradient(135deg,#475569 0%,#1E293B 100%)', color:'#E2E8F0', glow:'rgba(148,163,184,.4)' },
    confetti: ['#94A3B8','#E2E8F0','#fff'],
  },
  gold: {
    color: '#F59E0B', label: 'GOLD RANK',
    capsuleBottom: 'linear-gradient(160deg,#FDE68A,#F59E0B 55%,#B45309)',
    tensionMs: 1950,
    badge:{ bg:'linear-gradient(145deg,#2a1f08,#1a1200)', border:'rgba(255,215,0,.5)', glow:'rgba(255,215,0,.45)' },
    badgeGrad: 'linear-gradient(160deg,#fffde7,#FFD700 45%,#92400E)',
    btn:{ bg:'linear-gradient(135deg,#F59E0B 0%,#B45309 100%)', color:'#1C0A00', glow:'rgba(245,158,11,.55)' },
    confetti: ['#FFD700','#F59E0B','#fff'],
  },
  plat: {
    color: '#A78BFA', label: 'PLATINUM RANK',
    capsuleBottom: 'linear-gradient(160deg,#DDD6FE,#A78BFA 55%,#5B21B6)',
    tensionMs: 2250,
    badge:{ bg:'linear-gradient(145deg,#150a2a,#0a0618)', border:'rgba(167,139,250,.5)', glow:'rgba(167,139,250,.45)' },
    badgeGrad: 'linear-gradient(160deg,#faf5ff,#A78BFA 45%,#4c1d95)',
    btn:{ bg:'linear-gradient(135deg,#A78BFA 0%,#5B21B6 100%)', color:'#F5F3FF', glow:'rgba(167,139,250,.55)' },
    confetti: ['#A78BFA','#DDD6FE','#fff'],
  },
  legend: {
    color: '#EF4444', label: 'LEGENDARY RANK',
    capsuleBottom: 'linear-gradient(160deg,#FECACA,#EF4444 55%,#7F1D1D)',
    capsuleShake: true,
    tensionMs: 2600,
    badge:{ bg:'linear-gradient(145deg,#2a0808,#180404)', border:'rgba(255,85,85,.6)', glow:'rgba(255,60,60,.5)' },
    badgeGrad: 'linear-gradient(160deg,#fff1f2,#FF5555 45%,#7f1d1d)',
    btn:{ bg:'linear-gradient(135deg,#EF4444 0%,#7F1D1D 100%)', color:'#FFF1F2', glow:'rgba(239,68,68,.6)' },
    confetti: ['#FF5555','#FFD700','#fff'],
  }
};

let lbOpening    = false;
let liffReady    = false;
let liffProfile  = null;
let currentRoomNo = null;
let lootQueue    = [];   // คิวกล่องที่ยังไม่เปิด เรียงจาก milestone น้อย -> มาก

// ============================================================
//  UTILS
// ============================================================
async function callGAS(action, params = {}) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params })
  });
  return res.json();
}

function showToast(msg, type = 'success', duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast ' + type;
  setTimeout(() => t.className = 'toast', duration);
}

function showError(msg) {
  document.getElementById('lb-grid').innerHTML =
    `<div class="loading" style="color:#EF4444">${msg}</div>`;
}

// เอฟเฟกต์ริ้วคลื่นตอนแตะ ใช้กับกล่อง hero และกล่อง paid
function spawnRipple(e, el) {
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'tap-ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width  = size + 'px';
  ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
}

// ============================================================
//  LIFF
// ============================================================
async function initLiff() {
  try {
    await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true });
    liffReady = true;
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
    liffProfile = await liff.getProfile();
  } catch (e) {
    console.warn('LIFF init failed:', e);
    liffReady = false;
  }
}

// ============================================================
//  INIT
// ============================================================
async function init() {
  const grid   = document.getElementById('lb-grid');
  const params = new URLSearchParams(window.location.search);
  const room   = params.get('room');
  const token  = params.get('token');
  const isPaid = params.get('paid');
  const view   = params.get('view');

  if (room) {
    document.getElementById('lb-room-label').textContent = 'ห้อง ' + room;
  }

  if (isPaid !== null) {
    // ---- PAID PAGE ----
    document.querySelector('.dash-title h1').textContent = 'กล่องโบนัส';
    document.querySelector('.dash-title p').textContent  = 'รางวัลจากการจ่ายตรงเวลา';
    document.querySelector('.count-wrap').style.display  = 'none';

    grid.style.cssText = 'display:flex;justify-content:center;width:90%;max-width:380px';
    grid.innerHTML = `<div class="lb-card lb-skeleton" style="width:100%;height:290px"></div>`;

    await initLiff();
    await initPaidPage(room);
  } else {
    // ---- CHECK-IN PAGE (กล่องรวมใบเดียว) ----
    grid.style.cssText = 'display:flex;justify-content:center;width:90%;max-width:380px';
    grid.innerHTML = `<div class="lb-card lb-skeleton" style="width:100%;height:270px"></div>`;

    await initLiff();

    if (room) {
      await loadLootBoxForRoom(room);
    } else if (token) {
      await loadLootBoxByToken(token);
    } else if (liffReady && liff.isLoggedIn() && liffProfile) {
      await loadLootBoxByUserId(liffProfile.userId);
    } else {
      showError('❌ ไม่พบข้อมูลห้อง');
    }
  }

  if (view === 'history' && currentRoomNo) {
    openHistoryOverlay();
  }

  // ✅ ทุกอย่าง render เสร็จแล้ว ค่อยเอา mask ออก
  document.getElementById('boot-mask')?.remove();
}

// ============================================================
//  PAID PAGE
// ============================================================
async function initPaidPage(roomNo) {
  if (!roomNo) { showError('❌ ไม่พบข้อมูลห้อง'); return; }

  try {
    const result = await callGAS('getLootBoxDataByRoom', { roomNo });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    currentRoomNo = roomNo;
    showHistoryButton();
    renderPaidCard((result.boxes || {})['PAID'] || {});
  } catch (e) {
    showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ');
  }
}

function renderPaidCard(info) {
  const grid     = document.getElementById('lb-grid');
  const hasBox   = info.token && !info.opened;
  const isOpened = info.token &&  info.opened;
  const isLocked = !info.token;

  const card = document.createElement('div');
  card.className = 'lb-card'
    + (hasBox   ? ' can-open' : '')
    + (isOpened ? ' used'     : '')
    + (isLocked ? ' locked'   : '');
  card.id = 'lb-card-PAID';
  card.setAttribute('data-tier', 'paid');
  card.style.cssText = 'width:100%;padding:40px 20px;--t-color:#C084FC';

  card.innerHTML = `
    <span class="lb-card-icon" style="font-size:64px">${
      isOpened ? '🎁' : hasBox ? '🎁' : '🔒'
    }</span>
    <div class="lb-card-name" style="font-size:16px;margin-top:16px">PAID BONUS</div>
    <div class="lb-card-sub" style="font-size:14px;margin-top:8px">${
      hasBox   ? 'กดเพื่อเปิดกล่อง!' :
      isOpened ? 'เปิดแล้วเดือนนี้'  :
                 'จ่ายตรงเวลาเพื่อรับกล่อง'
    }</div>
    <div class="lb-card-ms ms-paid" style="margin-top:16px">จ่ายตรงเวลา</div>
  `;

  if (hasBox) {
    card.onclick = (e) => {
      spawnRipple(e, card);
      startLootOpen('PAID', 'กล่อง Paid Bonus', 'paid', info.token, () => {
        card.classList.remove('can-open');
        card.classList.add('used');
        const sub = card.querySelector('.lb-card-sub');
        if (sub) sub.textContent = 'เปิดแล้วเดือนนี้';
        card.onclick = null;
      });
    };
  }

  // ✅ wrap + border trace canvas
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%';

  if (hasBox) {
    const cv = document.createElement('canvas');
    cv.id = 'paid-trace';
    cv.style.cssText = 'position:absolute;inset:-3px;pointer-events:none;z-index:3;border-radius:27px';
    wrap.appendChild(cv);
  }

  wrap.appendChild(card);
  grid.innerHTML = '';
  grid.appendChild(wrap);

  setTimeout(() => {
    card.classList.add('fade-in');
    if (hasBox) initPaidTrace('paid-trace', wrap);
  }, 300);
}

// ============================================================
//  LOAD DATA
// ============================================================
async function loadLootBoxForRoom(roomNo) {
  try {
    const result = await callGAS('getLootBoxDataByRoom', { roomNo });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    renderPage(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

async function loadLootBoxByToken(token) {
  try {
    const result = await callGAS('getLootBoxData', { token });
    if (!result.success) { showError('❌ ' + (result.message || 'Token ไม่ถูกต้อง')); return; }
    renderPage(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

async function loadLootBoxByUserId(userId) {
  try {
    const result = await callGAS('getLootBoxData', { userId });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    renderPage(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

// ============================================================
//  RENDER — กล่องรวมใบเดียว
// ============================================================
function renderPage(result) {
  if (result.roomNo) {
    document.getElementById('lb-room-label').textContent = 'ห้อง ' + result.roomNo;
    currentRoomNo = result.roomNo;
    showHistoryButton();
  }
  buildLootQueue(result.boxes || {});
  document.getElementById('lb-count').textContent = lootQueue.length;
  renderHeroBox();
}

// สร้างคิวกล่องที่ยังไม่เปิด จากกล่องทั้ง 4 milestone (เรียงจากใบเก่าสุดก่อน)
// รวม PAID BONUS เข้าคิวเดียวกันด้วย ต่อท้ายกล่อง milestone ทั้งหมด
function buildLootQueue(boxes) {
  const queue = LB_CONFIG
    .filter(cfg => {
      const info = boxes[cfg.milestone] || {};
      return info.token && !info.opened;
    })
    .map(cfg => ({
      milestone: cfg.milestone,
      name: cfg.name,
      tier: cfg.tier,
      token: boxes[cfg.milestone].token
    }));

  const paidInfo = boxes['PAID'];
  if (paidInfo && paidInfo.token && !paidInfo.opened) {
    queue.push({
      milestone: 'PAID',
      name: 'กล่อง Paid Bonus',
      tier: 'paid',
      token: paidInfo.token
    });
  }

  lootQueue = queue;
}

// วาดกล่อง hero เดี่ยว — สีเรืองแสงจะพรีวิวจากกล่องใบถัดไปในคิว
function renderHeroBox() {
  const grid = document.getElementById('lb-grid');
  grid.style.cssText = 'display:flex;justify-content:center;width:90%;max-width:380px';
  grid.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%';

  const hasBox    = lootQueue.length > 0;
  const next      = hasBox ? lootQueue[0] : null;
  const tierColor = hasBox ? TIER_CFG[next.tier].color : '#475569';

  if (hasBox) {
    const cv = document.createElement('canvas');
    cv.className = 'sparks';
    cv.id = 'sp-hero';
    wrap.appendChild(cv);
  }

  const card = document.createElement('div');
  card.className = 'lb-card hero-card'
    + (hasBox ? ' can-open pulse-ready' : ' locked');
  card.id = 'lb-card-hero';
  card.style.cssText = `width:100%;--t-color:${tierColor}`;

  card.innerHTML = `
    ${hasBox ? `<div class="hero-count-badge" id="hero-count-badge">${lootQueue.length}</div>` : ''}
    <div class="hero-shine"></div>
    <span class="lb-card-icon hero-icon-anim" style="font-size:68px">${hasBox ? '🎁' : '🔒'}</span>
    <div class="lb-card-name" style="font-size:16px;margin-top:16px">กล่องสุ่มรางวัล</div>
    <div class="lb-card-sub" style="font-size:14px;margin-top:8px">${
      hasBox ? 'แตะเพื่อเปิดกล่อง!' : 'ยังไม่มีกล่องให้เปิดตอนนี้'
    }</div>
    <div class="lb-card-ms ms-hero" style="margin-top:16px">${
      hasBox ? `เหลืออีก ${lootQueue.length} ใบ` : 'เช็คอินต่อเนื่องเพื่อรับกล่องใหม่'
    }</div>
  `;

  if (hasBox) {
    card.onclick = (e) => { spawnRipple(e, card); openNextInQueue(); };
  }

  wrap.appendChild(card);
  grid.appendChild(wrap);

  setTimeout(() => {
    card.classList.add('fade-in');
    if (hasBox) initSparks('sp-hero', tierColor);
  }, 200);
}

// เปิดกล่องใบถัดไปในคิว แล้วรีเฟรชกล่อง hero เมื่อสำเร็จ
function openNextInQueue() {
  if (lbOpening || !lootQueue.length) return;
  const next = lootQueue[0];
  startLootOpen(next.milestone, next.name, next.tier, next.token, () => {
    lootQueue.shift();
    document.getElementById('lb-count').textContent = lootQueue.length;
    renderHeroBox();
  });
}

// ============================================================
//  SOLAR SYSTEM HTML
// ============================================================
function buildCapsuleHTML(tier) {
  const cfg = TIER_CFG[tier];
  return `
    <canvas id="capsule-sparks" class="capsule-sparks-canvas"></canvas>
    <div class="capsule-backdrop-glow" style="--ring-color:${cfg.color}"></div>
    <div class="capsule-ring" style="--ring-color:${cfg.color}"></div>
    <div class="capsule-ground-shadow"></div>
    <div class="capsule" id="capsule-el">
      <div class="capsule-top"></div>
      <div class="capsule-shine"></div>
      <div class="capsule-sweep"></div>
      <div class="capsule-seam" id="capsule-seam" style="--seam-color:${cfg.color}"></div>
      <div class="capsule-bottom${cfg.holo ? ' holo' : ''}" style="background:${cfg.capsuleBottom}"></div>
    </div>
    <div class="capsule-burst" id="capsule-burst" style="--burst-color:${cfg.color}"></div>
  `;
}

// ============================================================
//  OPEN LOOT BOX — แคปซูลกาชาปอง (หล่น -> แกว่งสะสมแสง -> แตก)
//  onDone: callback ที่เรียกหลังเปิดสำเร็จ ใช้อัปเดต UI ของกล่อง hero
// ============================================================
function startLootOpen(milestone, name, tier, token, onDone) {
  if (lbOpening) return;
  lbOpening = true;

  const cfg     = TIER_CFG[tier];
  const overlay = document.getElementById('lb-overlay');
  const flash   = document.getElementById('flash');

  document.documentElement.style.setProperty('--t-color', cfg.color);
  overlay.style.background = 'radial-gradient(circle at 50% 40%, #0F172A 0%, #020617 75%)';
  overlay.classList.add('active');
  document.getElementById('result-ui').classList.remove('show');
  document.getElementById('spin-wrap').style.display = 'flex';
  document.getElementById('spin-stage').innerHTML = buildCapsuleHTML(tier);

  const capsuleEl = document.getElementById('capsule-el');
  const seamEl    = document.getElementById('capsule-seam');
  seamEl.style.animationDuration = cfg.tensionMs + 'ms';

  // หลังตกถึงพื้น (~800ms) เริ่มแกว่งตัวเบาๆ + สะสมแสงที่รอยต่อ
  setTimeout(() => {
    capsuleEl.classList.add('idle-sway');
    seamEl.classList.add('charging');
    if (cfg.capsuleShake) capsuleEl.classList.add('capsule-shake-soft');
  }, 800);

  setTimeout(() => initSparks('capsule-sparks', cfg.color), 100);

  callGAS('openLootBox', { token })
    .then(result => {
      setTimeout(() => {
        if (!result.success) {
          closeLootPopup();
          showToast('❌ ' + (result.message || 'เกิดข้อผิดพลาด'), 'error');
          lbOpening = false;
          return;
        }

        // แคปซูลแตก — แสงฟุ้งนุ่มๆ พร้อมโทนสีของ tier แทนจอกระพริบขาว
        capsuleEl.classList.add('cracking');
        document.getElementById('capsule-burst').classList.add('burst');
        flash.style.background = cfg.color;
        flash.style.animation  = 'flashTriggerSoft .7s ease-out forwards';

        setTimeout(() => {
          flash.style.animation = '';
          document.getElementById('spin-wrap').style.display = 'none';
          overlay.style.background = 'radial-gradient(circle,#1E293B 0%,#000 100%)';

          const badge = document.getElementById('res-badge');
          const sym   = badge.querySelector('.res-badge-sym');
          badge.style.cssText = `width:90px;height:90px;border-radius:18px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;animation:badgeFloat 2s ease-in-out infinite alternate;background:${cfg.badge.bg};border:1.5px solid ${cfg.badge.border};box-shadow:0 0 28px ${cfg.badge.glow}`;
          sym.style.cssText   = `font-size:46px;font-weight:900;font-family:Arial Black,sans-serif;position:relative;z-index:1;line-height:1;background:${cfg.badgeGrad};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 14px ${cfg.color})`;
          document.getElementById('res-tier-name').textContent = cfg.label;

          const btn = document.getElementById('btn-claim');
          btn.style.setProperty('--btn-bg',    cfg.btn.bg);
          btn.style.setProperty('--btn-color', cfg.btn.color);
          btn.style.setProperty('--btn-glow',  cfg.btn.glow);
          btn.style.color = cfg.btn.color;

          const valEl = document.getElementById('prize-val');
          valEl.style.animation = 'none';
          valEl.textContent = '0';
          void valEl.offsetWidth;
          valEl.style.animation = '';
          document.getElementById('result-ui').classList.add('show');

          // อัปเดต UI ของกล่อง hero (ถอดใบที่เปิดแล้วออกจากคิว, รีเฟรชจำนวนคงเหลือ)
          if (onDone) onDone();

          setTimeout(() => {
            countUp(valEl, result.discount_amount, 1800);
            spawnConfetti(cfg.confetti);
          }, 300);

          lbOpening = false;
        }, 650);
      }, cfg.tensionMs);
    })
    .catch(() => {
      closeLootPopup();
      showToast('❌ เกิดข้อผิดพลาด กรุณาลองใหม่ครับ', 'error');
      lbOpening = false;
    });
}


// ============================================================
//  CLOSE
// ============================================================
function closeLootPopup() {
  const overlay = document.getElementById('lb-overlay');
  overlay.classList.remove('active');
  document.getElementById('result-ui').classList.remove('show');
  document.getElementById('spin-stage').innerHTML = '';
  spawnConfettiStop();
  lbOpening = false;
}

// ============================================================
//  COUNT UP
// ============================================================
function countUp(el, target, dur) {
  const t0 = performance.now();
  (function step(now) {
    const t = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - t, 6);
    el.textContent = Math.round(e * target);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target;
  })(t0);
}

// ============================================================
//  CONFETTI
// ============================================================
function spawnConfetti(cols) {
  const w = document.getElementById('lb-confetti');
  w.innerHTML = ''; w.classList.add('show');
  for (let i = 0; i < 70; i++) {
    const d = document.createElement('div');
    d.className = 'c-dot';
    const w2 = 3 + Math.random() * 4, h2 = w2 * (2.5 + Math.random() * 1.5);
    const col = cols[Math.floor(Math.random()*cols.length)];
    d.style.cssText = `left:${Math.random()*100}vw;width:${w2}px;height:${h2}px;background:${col};border-radius:2px;animation-duration:${2.6+Math.random()*2.2}s;animation-delay:${Math.random()*.8}s;box-shadow:0 0 4px ${col}`;
    w.appendChild(d);
  }
  setTimeout(() => spawnConfettiStop(), 6200);
}

function spawnConfettiStop() {
  const w = document.getElementById('lb-confetti');
  w.classList.remove('show');
  w.innerHTML = '';
}

// เหลือไว้เผื่อมีลิงก์ ?paid เก่าที่ยังยิงเข้ามา (ตอนนี้กล่อง PAID ถูกรวมเข้าคิวเดียวกับกล่อง hero แล้ว)
function closePaidOverlay() {
  document.getElementById('paid-overlay')?.classList.remove('active');
  document.getElementById('paid-result')?.classList.remove('show');
  lbOpening = false;
}

// ============================================================
//  SPARKS — กล่อง hero / paid
// ============================================================
function initSparks(id, baseColor) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const wrap = canvas.parentElement;
  canvas.width  = wrap.offsetWidth  || 160;
  canvas.height = wrap.offsetHeight || 180;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const cols = [baseColor, '#ffffff', baseColor + 'aa'];

  function spawn() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if      (edge === 0) { x = Math.random() * canvas.width; y = 0; }
    else if (edge === 1) { x = canvas.width;  y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height; }
    else                 { x = 0; y = Math.random() * canvas.height; }
    particles.push({
      x, y,
      vx: (Math.random() - .5) * 1.0,
      vy: (Math.random() - .5) * 1.0,
      size: 1.5 + Math.random() * 2,
      color: cols[Math.floor(Math.random() * cols.length)],
      life: 0,
      maxLife: 45 + Math.random() * 35
    });
  }

  let frame = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    if (frame % 7 === 0) spawn();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      const alpha = 1 - p.life / p.maxLife;
      if (alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// ============================================================
//  BORDER TRACE — PAID กล่องเดียว
// ============================================================
function initPaidTrace(id, wrap) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const W = (wrap.offsetWidth  || 320) + 6;
  const H = (wrap.offsetHeight || 260) + 6;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const r   = 27;
  const perimeter = 2 * (W + H) - (8 - 2 * Math.PI) * r;

  const tracers = [
    { t:0.0,  speed:0.0028, tailLen:0.18, col:'#E879F9' },
    { t:0.33, speed:0.0022, tailLen:0.14, col:'#A5F3FC' },
    { t:0.66, speed:0.0035, tailLen:0.12, col:'#C084FC' },
  ];

  function progressToPoint(prog) {
    prog = ((prog % 1) + 1) % 1;
    const dist   = prog * perimeter;
    const top    = W - 2*r + Math.PI*r/2;
    const right  = top    + H - 2*r + Math.PI*r/2;
    const bottom = right  + W - 2*r + Math.PI*r/2;

    if (dist <= top) {
      const topFlat = W - 2*r;
      if (dist <= topFlat) return { x: r + dist, y: 0 };
      const a = (dist - topFlat) / r - Math.PI/2;
      return { x: W-r + Math.cos(a)*r, y: r + Math.sin(a)*r };
    } else if (dist <= right) {
      const d2 = dist - top;
      if (d2 <= Math.PI*r/2) {
        const a = d2/r;
        return { x: W-r + Math.cos(a)*r, y: r + Math.sin(a)*r };
      }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= H-2*r) return { x: W, y: r + d3 };
      const a = (d3-(H-2*r))/r;
      return { x: W-r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
    } else if (dist <= bottom) {
      const d2 = dist - right;
      if (d2 <= Math.PI*r/2) {
        const a = d2/r;
        return { x: W-r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
      }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= W-2*r) return { x: W-r-d3, y: H };
      const a = Math.PI + (d3-(W-2*r))/r;
      return { x: r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
    } else {
      const d2 = dist - bottom;
      if (d2 <= Math.PI*r/2) {
        const a = Math.PI + d2/r;
        return { x: r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
      }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= H-2*r) return { x: 0, y: H-r-d3 };
      const a = (3*Math.PI/2) + (d3-(H-2*r))/r;
      return { x: r + Math.cos(a)*r, y: r + Math.sin(a)*r };
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    tracers.forEach(tr => {
      tr.t += tr.speed;
      for (let s = 40; s >= 0; s--) {
        const pt    = progressToPoint(tr.t - (s/40) * tr.tailLen);
        const alpha = (1 - s/40) * 0.9;
        const size  = 2.5 * (1 - s/40 * 0.6);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = tr.col;
        ctx.shadowColor = tr.col;
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
    });
    requestAnimationFrame(loop);
  }
  loop();
}
// ============================================================
//  HISTORY BUTTON + OVERLAY
// ============================================================
function showHistoryButton() {
  document.getElementById('btn-history').classList.add('show');
}

const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number);
  if (!y || !m) return monthKey;
  return `${TH_MONTHS[m - 1]} ${y + 543}`;
}

function getTierMeta(tierRaw) {
  if (String(tierRaw).trim() === 'PAID') {
    return { name: 'PAID BONUS', color: TIER_CFG.paid.color };
  }
  const cfg = LB_CONFIG.find(c => c.milestone === Number(tierRaw));
  if (cfg) return { name: cfg.name, color: TIER_CFG[cfg.tier].color };
  return { name: 'ไม่ทราบ', color: '#475569' };
}

function openHistoryOverlay() {
  document.getElementById('history-overlay').classList.add('active');
  loadHistory();
}

function closeHistoryOverlay() {
  document.getElementById('history-overlay').classList.remove('active');
}

async function loadHistory() {
  const body = document.getElementById('history-body');
  body.innerHTML = '<div class="loading">กำลังโหลด...</div>';

  if (!currentRoomNo) {
    body.innerHTML = '<div class="loading">❌ ไม่พบข้อมูลห้อง</div>';
    return;
  }

  try {
    const result = await callGAS('getLootHistory', { roomNo: currentRoomNo });
    if (!result.success) {
      body.innerHTML = `<div class="loading">❌ ${result.message || 'โหลดไม่ได้'}</div>`;
      return;
    }
    renderHistory(result.history || []);
  } catch (e) {
    body.innerHTML = '<div class="loading">❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ</div>';
  }
}

function renderHistory(history) {
  const body = document.getElementById('history-body');

  if (!history.length) {
    body.innerHTML = '<div class="loading">ยังไม่มีประวัติการเปิดกล่องครับ</div>';
    return;
  }

  body.innerHTML = history.map(h => {
    const total     = h.items.reduce((s, it) => s + (it.opened ? Number(it.amount) : 0), 0);
    const hasOpened = h.items.some(it => it.opened);

    const itemsHtml = h.items.map(it => {
      const meta = getTierMeta(it.tier);
      const amountHtml = it.opened
        ? `<span class="history-item-amount">฿${Number(it.amount).toLocaleString()}</span>`
        : `<span class="history-item-amount not-opened">ไม่ได้เปิด</span>`;
      return `
        <div class="history-item">
          <span class="history-item-tier" style="--tier-color:${meta.color}">
            <span class="history-item-dot"></span>${meta.name}
          </span>
          ${amountHtml}
        </div>`;
    }).join('');

    const statusHtml = hasOpened
      ? `<span class="history-status ${h.applied ? 'applied' : 'pending'}">${h.applied ? 'ตัดบิลแล้ว' : 'รอตัดบิล'}</span>`
      : '';

    const totalHtml = hasOpened
      ? `<div class="history-total">
           <span class="history-total-label">รวม</span>
           <span class="history-total-amount">฿${total.toLocaleString()}</span>
         </div>`
      : '';

    return `
      <div class="history-month">
        <div class="history-month-head">
          <span class="history-month-label">${formatMonthLabel(h.month)}</span>
          ${statusHtml}
        </div>
        <div class="history-items">${itemsHtml}</div>
        ${totalHtml}
      </div>`;
  }).join('');
}
// ============================================================
//  START
// ============================================================
init();
