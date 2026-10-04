// 婚礼请柬脚本 —— 内容全部来自 config.js（WEDDING_CONFIG），修改 config 即可更新全站
// 打开页面时始终停留在第一屏，避免浏览器恢复滚动位置或 hash 跳转
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function forceScrollTop() {
  if (!document.body.classList.contains('blessing-locked')) return;

  // 临时关闭平滑滚动，确保复位是瞬时的，不会被 smooth 动画带偏
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  html.style.scrollBehavior = prev;
}

window.addEventListener('pageshow', () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  // 浏览器可能在 pageshow 之后才恢复滚动位置，用双重 rAF 覆盖
  requestAnimationFrame(() => requestAnimationFrame(forceScrollTop));
});

window.addEventListener('load', () => {
  setTimeout(forceScrollTop, 60);
});

// ==================== 从 config.js 读取婚礼信息并渲染 ====================

const CFG = window.WEDDING_CONFIG || {};

// 取深层属性，如 "location.name"
function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

// 渲染日历：按婚礼年月自动生成月份表格，并标记婚礼日
function renderCalendar() {
  const grid = document.querySelector('[data-calendar-grid]');
  if (!grid) return;
  const d = CFG.date || {};
  const year = d.year || new Date().getFullYear();
  const month = d.month || new Date().getMonth() + 1;
  const day = d.day || 1;

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  let html = '';
  for (let i = 0; i < firstWeekday; i += 1) {
    html += '<span class="calendar-day calendar-day--empty" aria-hidden="true"></span>';
  }
  for (let date = 1; date <= daysInMonth; date += 1) {
    if (date === day) {
      html += `<span class="calendar-day calendar-day--wedding" aria-label="${month}月${day}日，婚礼日"><span>${date}</span><i class="calendar-day__heart" aria-hidden="true"></i><small>婚礼日</small></span>`;
    } else if (date === day - 1) {
      html += `<span class="calendar-day calendar-day--prewedding" aria-label="${month}月${date}日，陪老红暖房酒"><span>${date}</span><i class="calendar-day__dot" aria-hidden="true"></i><small>陪老红</small></span>`;
    } else {
      html += `<span class="calendar-day">${date}</span>`;
    }
  }
  const total = firstWeekday + daysInMonth;
  const trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 0; i < trailing; i += 1) {
    html += '<span class="calendar-day calendar-day--empty" aria-hidden="true"></span>';
  }
  grid.innerHTML = html;

  const calendar = document.querySelector('.letter-calendar');
  if (calendar) calendar.setAttribute('aria-label', `${year}年${month}月婚礼日历`);
}

// 渲染地点页的到达方式卡片
function renderTravel() {
  const guide = document.querySelector('[data-travel-guide]');
  if (!guide) return;
  const travel = CFG.travel || {};
  const vars = buildVars();
  guide.innerHTML = `
    <article class="travel-card travel-card--drive">
      <span class="travel-icon travel-icon--car" aria-hidden="true"></span>
      <div>
        <h3>${travel.driveTitle || '自驾前往'}</h3>
        <p>${replaceVars(travel.driveText || '', vars)}</p>
      </div>
    </article>
    <article class="travel-card travel-card--train">
      <span class="travel-icon travel-icon--train" aria-hidden="true"></span>
      <div>
        <h3>${travel.trainTitle || '高铁到达'}</h3>
        <p>${replaceVars(travel.trainText || '', vars)}</p>
      </div>
    </article>`;
}

// 渲染地点页的住宿 & 接送说明
function renderStayNote() {
  const note = document.querySelector('[data-stay-note]');
  if (!note) return;
  const travel = CFG.travel || {};
  const vars = buildVars();
  note.innerHTML = `
    <div class="stay-transfer-note__icon" aria-hidden="true">⌂</div>
    <div>
      <p class="stay-transfer-note__title">${travel.stayTitle || '住宿 & 接送安排'}</p>
      <p>${replaceVars(travel.stayText || '', vars)}</p>
      <p class="stay-transfer-note__reminder">${travel.stayReminder || ''}</p>
    </div>`;
}

// 渲染美食页卡片
function renderFood() {
  const list = document.querySelector('[data-food-list]');
  if (!list) return;
  const kinds = ['soup', 'noodles', 'rice', 'tea'];
  const items = (CFG.food && CFG.food.list ? CFG.food.list : []).map((item, index) => {
    const kind = kinds[index % kinds.length];
    const desc2 = item.desc2 ? `<p>${item.desc2}</p>` : '';
    return `
      <article class="food-card food-card--${kind}">
        <div class="food-photo">
          <img src="${item.image}" alt="${item.title}" />
        </div>
        <div class="food-card__body">
          <p class="food-card__tag">${item.tag || ''}</p>
          <h3>${item.title || ''}</h3>
          <p>${item.desc1 || ''}</p>
          ${desc2}
        </div>
      </article>`;
  }).join('');
  list.innerHTML = items;
}

// 渲染赴宴闲游页卡片
function renderTour() {
  const list = document.querySelector('[data-tour-list]');
  if (!list) return;
  const kinds = ['lake', 'archway', 'town'];
  const items = (CFG.tour && CFG.tour.list ? CFG.tour.list : []).map((item, index) => {
    const kind = kinds[index % kinds.length];
    const desc2 = item.desc2 ? `<p>${item.desc2}</p>` : '';
    return `
      <article class="tour-card tour-card--${kind}">
        <div class="tour-photo-placeholder tour-photo-placeholder--filled">
          <img src="${item.image}" alt="${item.title}" />
        </div>
        <div class="tour-card__body">
          <p class="tour-card__tag">${item.tag || ''}</p>
          <h3>${item.title || ''}</h3>
          <span class="tour-distance">${item.distance || ''}</span>
          <p>${item.desc1 || ''}</p>
          ${desc2}
        </div>
      </article>`;
  }).join('');
  list.innerHTML = items;
}

// 应用地点链接、地图截图与复制按钮内容
function applyMap() {
  const location = CFG.location || {};
  document.querySelectorAll('[data-map-link]').forEach((link) => {
    link.href = location.mapUrl || '#';
  });
  const mapImage = document.querySelector('[data-map-image]');
  if (mapImage) mapImage.src = location.mapImage || './map.png';
  const copyButton = document.querySelector('[data-copy]');
  if (copyButton) copyButton.setAttribute('data-copy', location.copyAddress || location.name || '');
}

// 用于文案占位符替换的变量
function buildVars() {
  const d = CFG.date || {};
  const location = CFG.location || {};
  return {
    date: `${d.year}年${d.month}月${d.day}日 ${d.time || ''}`,
    city: location.city || '',
    venue: location.name || '',
    station: location.highSpeedRailStation || '',
  };
}

function replaceVars(text, vars) {
  return String(text || '').replace(/\{(\w+)\}/g, (match, name) => (vars[name] != null ? vars[name] : match));
}

// 将 config 内容写入页面（data-bind 元素）
function applyConfig() {
  const d = CFG.date || {};
  const computed = {
    dateLine: `${d.year}年${d.month}月${d.day}日 ${d.time || ''} ${d.lunar || ''}`,
    calendarTitle: `${d.year} 年 ${d.month} 月`,
    calendarFooter: `<span aria-hidden="true">✦</span> ${d.month} 月 ${d.day} 日 · ${d.time || ''} <span aria-hidden="true">✦</span>`,
  };
  const vars = buildVars();

  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    let value = computed[key] != null ? computed[key] : getPath(CFG, key);
    if (typeof value === 'string') value = replaceVars(value, vars);
    if (value != null) el.innerHTML = value;
  });

  renderCalendar();
  renderTravel();
  renderStayNote();
  renderFood();
  renderTour();
  applyMap();
}

applyConfig();

// ==================== 原有交互与动画逻辑 ====================

const dots = Array.from(document.querySelectorAll('.dot'));
const sections = Array.from(document.querySelectorAll('.screen'));
const toast = document.querySelector('.toast');
const bgm = document.querySelector('#bgm');
const musicToggle = document.querySelector('[data-music-toggle]');
const musicHeart = document.querySelector('[data-music-heart]');
const spriteParade = document.querySelector('[data-sprite-parade]');
const weddingCountdown = document.querySelector('[data-wedding-countdown]');
const countdownDays = document.querySelector('[data-countdown-days]');

// 婚礼日期（用于倒计时），自动取自 config.js
const d = CFG.date || {};
const WEDDING_DATE = Date.UTC(d.year || 2026, (d.month || 1) - 1, d.day || 1);
const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
const SPRITE_SHEET_URL = './sprite.png';
const CAR_IMAGE_URL = './car.png';
const SPRITE_GRID_COLUMNS = 3;
const SPRITE_GRID_ROWS = 3;
const SPRITE_ACTORS = {
  orangeCat: { grid: [0, 0], side: 'left', left: '5%', top: '66%', size: 90, delay: 40 },
  blackCat: { grid: [1, 0], side: 'right', left: '74%', top: '66%', size: 90, delay: 80 },

  roseDove: { grid: [2, 0], side: 'right', left: '81%', top: '30%', size: 82, delay: 140, flip: true },
  violetDove: { grid: [0, 1], side: 'left', left: '3%', top: '31%', size: 82, delay: 180 },

  peach: { grid: [1, 1], side: 'left', left: '4%', top: '78%', size: 60, delay: 220 },
  blueApple: { grid: [2, 1], side: 'right', left: '87%', top: '78%', size: 60, delay: 260, flip: true },

  grapeCluster: { grid: [0, 2], side: 'left', left: '4%', top: '86%', size: 68, delay: 300, flip: true },
  grape: { grid: [1, 2], side: 'right', left: '85%', top: '86%', size: 62, delay: 340 },
};

function preventLockedScroll(event) {
  if (document.body.classList.contains('blessing-locked')) {
    event.preventDefault();
  }
}

window.addEventListener('touchmove', preventLockedScroll, { passive: false });
window.addEventListener('wheel', preventLockedScroll, { passive: false });

const observer = new IntersectionObserver((entries) => {
  const visibleEntry = entries
    .filter((entry) => entry.isIntersecting)
    .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

  entries.forEach((entry) => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });

  if (!visibleEntry) return;

  const index = sections.indexOf(visibleEntry.target);
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === index);
  });
}, { threshold: 0.58 });

sections.forEach((section) => observer.observe(section));

prepareSpriteActors();
prepareCarIcon();
updateWeddingCountdown();
window.setInterval(updateWeddingCountdown, 60 * 60 * 1000);

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const text = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制地址');
    } catch {
      showToast(text);
    }
  });
});

musicToggle.addEventListener('click', async () => {
  if (!bgm.paused) {
    bgm.pause();
    return;
  }

  try {
    await bgm.play();
    hideMusicHeart();
  } catch {
    showToast('请再次点击开启音乐');
  }
});

musicHeart.addEventListener('click', async (event) => {
  event.preventDefault();
  event.stopPropagation();
  musicHeart.classList.add('is-activating');

  try {
    await bgm.play();
    unlockBlessing();
    activateSpriteParade();
    window.setTimeout(hideMusicHeart, 720);
  } catch {
    musicHeart.classList.remove('is-activating');
    showToast('请再次点击开启音乐');
  }
});

bgm.addEventListener('pause', () => updateMusicState(false));
bgm.addEventListener('play', () => updateMusicState(true));

function updateMusicState(isPlaying) {
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? '暂停背景音乐' : '播放背景音乐');
}

function updateWeddingCountdown() {
  if (!weddingCountdown || !countdownDays) return;

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(today.map(({ type, value }) => [type, value]));
  const todayUtc = Date.UTC(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day));
  const daysRemaining = Math.ceil((WEDDING_DATE - todayUtc) / (24 * 60 * 60 * 1000));

  if (daysRemaining === 0) {
    countdownDays.textContent = '今天';
    weddingCountdown.querySelector('.wedding-countdown__label').textContent = '今天就是婚礼日';
    weddingCountdown.querySelector('.wedding-countdown__unit').textContent = '';
    weddingCountdown.classList.add('is-today');
    return;
  }

  if (daysRemaining < 0) {
    countdownDays.textContent = '已到';
    weddingCountdown.querySelector('.wedding-countdown__label').textContent = '婚礼日已到';
    weddingCountdown.querySelector('.wedding-countdown__unit').textContent = '';
    weddingCountdown.classList.add('is-today');
    return;
  }

  countdownDays.textContent = String(daysRemaining);
}

async function prepareCarIcon() {
  const carIcon = document.querySelector('.travel-icon--car');
  if (!carIcon) return;

  const carImage = await loadImage(CAR_IMAGE_URL);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = carImage.naturalWidth;
  canvas.height = carImage.naturalHeight;
  context.drawImage(carImage, 0, 0);
  clearConnectedBackground(context, canvas.width, canvas.height);
  carIcon.style.backgroundImage = `url("${trimCanvas(canvas).toDataURL('image/png')}")`;
}

async function prepareSpriteActors() {
  const spriteSheet = await loadImage(SPRITE_SHEET_URL);

  Object.entries(SPRITE_ACTORS).forEach(([name, actor]) => {
    const image = document.createElement('img');
    image.className = `sprite-actor sprite-actor--${name}`;
    image.alt = '';
    image.src = cropSprite(spriteSheet, actor.grid[0], actor.grid[1]);
    image.style.left = actor.left;
    image.style.top = actor.top;
    image.style.setProperty('--sprite-size', `${actor.size}px`);
    image.style.setProperty('--sprite-delay', `${actor.delay}ms`);
    image.style.setProperty('--sprite-flip', actor.flip ? '-1' : '1');
    image.style.setProperty('--sprite-start-x', actor.side === 'left' ? '-135vw' : '135vw');
    spriteParade.append(image);
    requestAnimationFrame(() => image.classList.add('is-ready'));
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', reject, { once: true });
    image.src = source;
  });
}

function cropSprite(spriteSheet, column, row) {
  const cellWidth = spriteSheet.naturalWidth / SPRITE_GRID_COLUMNS;
  const cellHeight = spriteSheet.naturalHeight / SPRITE_GRID_ROWS;
  const sourceX = Math.round(column * cellWidth);
  const sourceY = Math.round(row * cellHeight);
  const sourceWidth = Math.round(cellWidth);
  const sourceHeight = Math.round(cellHeight);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  context.drawImage(spriteSheet, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
  clearCanvasBorder(context, sourceWidth, sourceHeight);
  clearConnectedBackground(context, sourceWidth, sourceHeight);

  return trimCanvas(canvas).toDataURL('image/png');
}

function clearCanvasBorder(context, width, height) {
  context.clearRect(0, 0, width, 8);
  context.clearRect(0, height - 8, width, 8);
  context.clearRect(0, 0, 8, height);
  context.clearRect(width - 8, 0, 8, height);
}

function trimCanvas(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const { data } = context.getImageData(0, 0, width, height);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) return canvas;

  const padding = 3;
  const cropLeft = Math.max(0, left - padding);
  const cropTop = Math.max(0, top - padding);
  const cropWidth = Math.min(width - cropLeft, right - left + 1 + padding * 2);
  const cropHeight = Math.min(height - cropTop, bottom - top + 1 + padding * 2);
  const trimmed = document.createElement('canvas');
  const trimmedContext = trimmed.getContext('2d');

  trimmed.width = cropWidth;
  trimmed.height = cropHeight;
  trimmedContext.drawImage(canvas, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return trimmed;
}

function clearConnectedBackground(context, width, height) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const isBackground = (pixelIndex) => {
    const red = data[pixelIndex];
    const green = data[pixelIndex + 1];
    const blue = data[pixelIndex + 2];
    return red > 175 && green > 175 && blue > 175 && Math.max(red, green, blue) - Math.min(red, green, blue) < 28;
  };

  const enqueue = (x, y) => {
    const offset = y * width + x;
    const pixelIndex = offset * 4;
    if (visited[offset] || !isBackground(pixelIndex)) return;
    visited[offset] = 1;
    queue.push(offset);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const offset = queue[index];
    const x = offset % width;
    const y = Math.floor(offset / width);
    data[offset * 4 + 3] = 0;
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  context.putImageData(imageData, 0, 0);
}

function activateSpriteParade() {
  spriteParade.classList.add('is-active');
}

function hideMusicHeart() {
  musicHeart.classList.add('is-hidden');
}

function unlockBlessing() {
  document.body.classList.remove('blessing-locked');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}
