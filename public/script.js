const CLASSROOMS = [
  '7/1','7/2','7/3','7/4',
  '8/1','8/2','8/3','8/4',
  '9/1','9/2','9/3','9/4',
  '10/1','10/2','10/3','10/4',
  '11/1','11/2'
];

let myClass       = null;
let myCount       = 0;
let pendingClicks = 0;
let flushTimer    = null;

const loginScreen = document.getElementById('login-screen');
const gameScreen  = document.getElementById('game-screen');
const topCount    = document.getElementById('top-count');
const topClass    = document.getElementById('top-class');
const face        = document.getElementById('face');
const clicker     = document.getElementById('clicker');
const lbBar       = document.getElementById('lb-bar') || document.querySelector('.lb-bar');
const lbToggle    = document.getElementById('lb-toggle');
const lbList      = document.getElementById('lb-list');
const grid        = document.getElementById('classroom-grid');

// Build classroom buttons
CLASSROOMS.forEach(cls => {
  const btn = document.createElement('button');
  btn.className = 'cls-btn';
  btn.textContent = cls;
  btn.addEventListener('click', () => enterGame(cls));
  grid.appendChild(btn);
});

// Restore session
const saved = sessionStorage.getItem('myClass');
if (saved && CLASSROOMS.includes(saved)) enterGame(saved);

function enterGame(cls) {
  myClass = cls;
  sessionStorage.setItem('myClass', cls);
  topClass.textContent = 'ห้อง ' + cls;
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  fetchLeaderboard();
  setInterval(fetchLeaderboard, 3000);
}

// Leaderboard toggle
lbToggle.addEventListener('click', () => {
  document.querySelector('.lb-bar').classList.toggle('open');
});

// Click handler
clicker.addEventListener('mousedown', handleClick);
clicker.addEventListener('touchstart', e => {
  e.preventDefault();
  handleClick(e.touches[0]);
}, { passive: false });

function handleClick(e) {
  if (!myClass) return;

  // Swap face
  face.src = '/assets/afterclick.jpg';
  setTimeout(() => { face.src = '/assets/beforeclick.jpg'; }, 120);

  // "เลือก เบอร์ 3" at a random spot on screen
  const vt = document.createElement('div');
  vt.className = 'float-vote';
  vt.textContent = 'เลือก เบอร์ 3';
  vt.style.left = (10 + Math.random() * (window.innerWidth  - 200)) + 'px';
  vt.style.top  = (10 + Math.random() * (window.innerHeight - 80))  + 'px';
  document.body.appendChild(vt);
  vt.addEventListener('animationend', () => vt.remove());

  // +1 follows cursor
  const el = document.createElement('div');
  el.className = 'float-num';
  el.textContent = '+1';
  el.style.left = ((e.clientX ?? e.pageX) - 10) + 'px';
  el.style.top  = ((e.clientY ?? e.pageY) - 20) + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());

  // Count
  myCount++;
  topCount.textContent = myCount.toLocaleString();
  pendingClicks++;
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 300);
}

async function flush() {
  if (!pendingClicks || !myClass) return;
  const n = pendingClicks;
  pendingClicks = 0;
  try {
    await fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroom: myClass, amount: n })
    });
  } catch (_) {
    pendingClicks += n;
  }
}

async function fetchLeaderboard() {
  try {
    const res  = await fetch('/api/leaderboard');
    const data = await res.json();
    renderLeaderboard(data);
  } catch (_) {}
}

function renderLeaderboard(data) {
  const mine = data.find(r => r.classroom === myClass);
  if (mine && mine.count > myCount) {
    myCount = mine.count;
    topCount.textContent = myCount.toLocaleString();
  }

  lbList.innerHTML = '';
  data.forEach((row, i) => {
    const li = document.createElement('li');
    li.className = 'lb-item';
    if (i === 0) li.classList.add('top1');
    if (row.classroom === myClass) li.classList.add('mine');

    const rank = i === 0 ? '#1' : i === 1 ? '#2' : i === 2 ? '#3' : `#${i+1}`;

    li.innerHTML =
      `<span class="lb-rank">${rank}</span>` +
      `<span class="lb-class">ห้อง ${row.classroom}${row.classroom === myClass ? '  (คุณ)' : ''}</span>` +
      `<span class="lb-count">${row.count.toLocaleString()}</span>`;

    lbList.appendChild(li);
  });
}
