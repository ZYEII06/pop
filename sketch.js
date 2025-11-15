let circles = []; // 儲存圓的資料 (氣球)
let moveScale = 0.45; // 全域移動速度縮放
let explosions = []; // 存放正在發生的爆破效果
let lastExplosionTime = 0;
let explosionInterval = 1000; // 毫秒，每隔 1 秒啟動一個爆破

// 背景顏色
let bgColor = [255, 204, 213];
let macaronColors = [
  [255, 173, 173], 
  [255, 214, 165], 
  [253, 255, 182], 
  [202, 255, 191], 
  [155, 246, 255], 
  [160, 196, 255], 
  [189, 178, 255], 
  [255, 198, 255], 
  [255, 255, 252] 
];

// --- 聲音與啟動相關變數 ---
let popSound;
let isStarted = false; // 追蹤程式是否已啟動（點擊過畫面）


// --- 1. 預先載入音效 ---
function preload() {
  // 請確認你的音效檔名是 pop.mp3
  popSound = loadSound('pop.mp3'); 
}


// --- 2. 設定 (只執行一次) ---
function setup() { 
  createCanvas(windowWidth, windowHeight); 
  background('#ffccd5'); 
  noStroke();

  // 產生 100 個氣球圓
  for (let i = 0; i < 100; i++) {
    let r = random(30, 120);
    let speed = map(r, 30, 120, 3, 0.5);
    let colorIdx = floor(random(macaronColors.length));
    circles.push({
      x: random(width),
      y: random(height),
      r: r,
      alpha: random(50, 255),
      speed: speed,
      color: macaronColors[colorIdx]
    });
  }
}


// --- 3. 繪圖與動畫 (重複執行) ---
function draw() { 
  // 尚未啟動時，顯示啟動提示畫面
  if (!isStarted) {
    displayStartScreen();
    return; // 尚未啟動，不執行後續動畫邏輯
  }
  
  // 程式已啟動，開始繪製動畫
  background('#ffccd5'); // 每次重畫背景
  noStroke();

  // --- 處理爆破生成（每隔 explosionInterval 毫秒產生一個）
  let now = millis();
  if (now - lastExplosionTime > explosionInterval) {
    spawnExplosion();
    lastExplosionTime = now;
  }

  // --- 更新並畫出所有爆破效果
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    e.age += deltaTime;
    let life = constrain(e.age / e.duration, 0, 1); // 0 -> 1

    push();
    translate(e.x, e.y);
    noStroke();
    for (let p of e.particles) {
      let px = cos(p.angle) * p.radius + p.ox;
      let py = sin(p.angle) * p.radius + p.oy;
      let sizeNow = max(0, p.size * (1 - life));
      let alphaNow = p.alpha * (1 - life);
      if (sizeNow > 0.2) {
        fill(p.color[0], p.color[1], p.color[2], alphaNow);
        ellipse(px, py, sizeNow, sizeNow);
      }
    }
    pop();

    if (e.age >= e.duration) {
      explosions.splice(i, 1);
    }
  }

  // --- 畫出所有氣球並讓它們往上移動
  for (let c of circles) {
    // 主體圓
    fill(c.color[0], c.color[1], c.color[2], c.alpha);
    ellipse(c.x, c.y, c.r, c.r);

    // 氣球上的反光方塊
    let R = c.r / 2; // 半徑
    let side = R * 0.35;
    let halfDiag = side * Math.SQRT2 / 2;
    let d = R - halfDiag - 2;
    if (d < 0) d = 0;
    let offset = d / Math.SQRT2;
    let squareCenterX = c.x + offset;
    let squareCenterY = c.y - offset;
    let sx = squareCenterX - side / 2;
    let sy = squareCenterY - side / 2;
    let corner = side * 0.25; 
    let whiteAlpha = 180; 
    fill(255, 255, 255, whiteAlpha);
    rect(sx, sy, side, side, corner);

    // 移動與重置位置
    c.y = c.y - c.speed * moveScale; // 往上移動

    // 如果超出上方邊界，從下方重新出現
    if (c.y < -c.r / 2) {
      c.y = height + c.r / 2;
    }
  }

  // --- 繪製左上角文字
  // 1. 設定文字樣式
  textSize(15);
  fill('#4B0082'); // 靛色 (Indigo)
  
  // 2. 設定文字對齊
  textAlign(LEFT, TOP);
  
  // 3. 繪製文字
  text('30670', 10, 10);
}


// --- 4. 輔助函式：處理點擊啟動音效 ---
function mousePressed() {
  // 狀況一：程式尚未啟動
  if (!isStarted) {
    // 啟動瀏覽器音訊環境
    userStartAudio(); 
    isStarted = true;
    return; // 僅啟動，不執行後續點擊邏輯
  }

  // 狀況二：程式已啟動，檢查是否點擊到氣球
  // 從後往前遍歷，這樣如果未來要刪除元素也安全
  for (let i = circles.length - 1; i >= 0; i--) {
    let c = circles[i];
    let d = dist(mouseX, mouseY, c.x, c.y);
    
    // 如果點擊位置在氣球半徑內
    if (d < c.r / 2) {
      // 在氣球位置產生爆破效果
      createExplosionAt(c.x, c.y, [c.color, macaronColors[floor(random(macaronColors.length))]]);
      
      // 重置被點擊的氣球位置到畫面下方
      c.y = height + c.r / 2 + random(0, 60);
      c.x = random(width); // 也可以給一個隨機的 x 位置
      
      // 播放音效
      if (popSound.isLoaded()) {
        popSound.play();
      }
      
      break; // 只處理第一個點擊到的氣球，然後停止檢查
    }
  }
}

// 顯示啟動畫面
function displayStartScreen() {
  background('#ffccd5'); 
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(32);
  // 閃爍效果
  if (sin(frameCount * 0.1) > 0) {
    text('點擊畫面開始遊戲', width / 2, height / 2);
  }
  textSize(16);
  fill(100);
  text('（啟用音效）', width / 2, height / 2 + 50);
}


// --- 5. 輔助函式：產生爆破效果 ---

function createExplosionAt(x, y, colors) {
  let ex = {
    x: x,
    y: y,
    age: 0,
    duration: 1000, 
    maxRadius: random(40, 120),
    particles: []
  };

  // 嘗試從 macaronColors 中選一對相鄰且與背景有足夠對比的顏色 (邏輯保持不變)
  let particleColors = [];
  if (colors) {
    // 如果提供了顏色，就使用它們
    particleColors = colors;
  } else {
    // 否則，執行原有的隨機顏色選擇邏輯
    const MIN_DIST_SQ = 5000; 
    let baseIdx = floor(random(macaronColors.length));
    let secondIdx = (baseIdx + (random() < 0.5 ? 1 : -1) + macaronColors.length) % macaronColors.length;
    let attempts = 0;
    while (attempts < macaronColors.length) {
      let c1 = macaronColors[baseIdx];
      let c2 = macaronColors[secondIdx];
      if (colorDistSq(c1, bgColor) >= MIN_DIST_SQ || colorDistSq(c2, bgColor) >= MIN_DIST_SQ) {
        break; 
      }
      baseIdx = (baseIdx + 1) % macaronColors.length;
      secondIdx = (baseIdx + 1) % macaronColors.length;
      attempts++;
    }
    particleColors = [macaronColors[baseIdx], macaronColors[secondIdx]];
  }

  // 產生粒子
  let particleCount = floor(random(10, 18));
  let ringRadius = ex.maxRadius * 0.6;
  function colorDistSq(a, b) {
    return (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]) + (a[2]-b[2])*(a[2]-b[2]);
  }
  const MIN_DIST_SQ = 5000; 
  let baseIdx = floor(random(macaronColors.length));
  let secondIdx = (baseIdx + (random() < 0.5 ? 1 : -1) + macaronColors.length) % macaronColors.length;
  let attempts = 0;
  while (attempts < macaronColors.length) {
    let c1 = macaronColors[baseIdx];
    let c2 = macaronColors[secondIdx];
    if (colorDistSq(c1, bgColor) >= MIN_DIST_SQ || colorDistSq(c2, bgColor) >= MIN_DIST_SQ) {
      break; 
    }
    baseIdx = (baseIdx + 1) % macaronColors.length;
    secondIdx = (baseIdx + 1) % macaronColors.length;
    attempts++;
  }

  let useFallback = (colorDistSq(macaronColors[baseIdx], bgColor) < MIN_DIST_SQ && colorDistSq(macaronColors[secondIdx], bgColor) < MIN_DIST_SQ);
  let fallback1 = [255 - bgColor[0], 255 - bgColor[1], 255 - bgColor[2]];
  let fallback2 = [
    min(255, fallback1[0] + 30),
    min(255, fallback1[1] + 30),
    min(255, fallback1[2] + 30)
  ];

  for (let i = 0; i < particleCount; i++) {
    let angle = (TWO_PI / particleCount) * i + random(-0.1, 0.1);
    let chosenColor;
    if (useFallback) {
      chosenColor = random() < 0.5 ? fallback1 : fallback2;
    } else {
      chosenColor = random() < 0.5 ? particleColors[0] : particleColors[1];
    }
    ex.particles.push({
      angle: angle,
      radius: ringRadius + random(-6, 6),
      size: random(6, 12),
      alpha: random(160, 230),
      ox: random(-4, 4),
      oy: random(-4, 4),
      color: chosenColor
    });
  }

  explosions.push(ex);
  return ex; // 回傳建立的爆破物件
}

// 定時產生隨機爆破
function spawnExplosion() {
  // 爆破時播放音效
  if (popSound.isLoaded()) { 
    popSound.play();
  }
  
  // 在隨機位置產生爆破
  let x = random(width * 0.1, width * 0.9);
  let y = random(height * 0.1, height * 0.9);
  let ex = createExplosionAt(x, y); // 接收回傳的爆破物件

  // 被爆破影響的圓重置位置
  let respawnCount = floor(random(2, 6));
  for (let i = 0; i < respawnCount; i++) {
    let idx = floor(random(circles.length));
    circles[idx].x = ex.x + random(-ex.maxRadius * 0.8, ex.maxRadius * 0.8);
    circles[idx].y = height + circles[idx].r / 2 + random(0, 60);
    circles[idx].speed = map(circles[idx].r, 30, 120, 2.5, 0.4);
    circles[idx].alpha = random(120, 255);
  }
}