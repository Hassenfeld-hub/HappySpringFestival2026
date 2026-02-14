// Supabase 配置
const SUPABASE_URL = "https://ienzafqabglqiggpbjza.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnphZnFhYmdscWlnZ3BianphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODgxMjgsImV4cCI6MjA4NjU2NDEyOH0.IY1Cu3rPCvaaVAhStoGrHND-i6pRWB7wIfuzsC_5O4o";

let _supabase = null;
try {
  if (typeof supabase !== "undefined") {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn("Supabase SDK 未加载，许愿功能将不可用");
  }
} catch (error) {
  console.error("Supabase 初始化失败:", error);
}

// 页面切换
function navigateTo(target) {
  const home = document.getElementById("view-home");
  const wall = document.getElementById("view-wall");
  if (target === "wall") {
    home.classList.replace("active", "hidden");
    setTimeout(() => {
      home.style.display = "none";
      wall.style.display = "flex";
      setTimeout(() => {
        wall.classList.replace("hidden", "active");
        fetchWishes();
      }, 50);
    }, 600);
  } else {
    wall.classList.replace("active", "hidden");
    setTimeout(() => {
      wall.style.display = "none";
      home.style.display = "flex";
      setTimeout(() => home.classList.replace("hidden", "active"), 50);
    }, 600);
  }
}

// 许愿功能
function toggleModal(show) {
  document.getElementById("wish-modal").style.display = show ? "flex" : "none";
}

async function fetchWishes() {
  const grid = document.getElementById("message-grid");
  grid.innerHTML =
    '<p style="color:var(--ink-red); font-family:Ma Shan Zheng">正在展开画轴...</p>';

  if (!_supabase) {
    grid.innerHTML =
      '<p style="color:var(--ink-red); font-family:Ma Shan Zheng">😔 许愿功能暂不可用</p>';
    return;
  }

  try {
    const { data, error } = await _supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      grid.innerHTML = data
        .map(
          (item) => `
            <div class="message-card" style="transform: rotate(${Math.random() * 6 - 3}deg)">
                <p>${item.content}</p>
                <small style="margin-top:10px; opacity:0.8">—— ${item.is_anonymous ? "匿名" : item.name || "无名氏"}</small>
            </div>
          `,
        )
        .join("");
    } else {
      grid.innerHTML =
        '<p style="color:var(--ink-red); font-family:Ma Shan Zheng">还没有愿望，快来许下第一个愿望吧！</p>';
    }
  } catch (err) {
    console.error("获取愿望失败:", err);
    grid.innerHTML =
      '<p style="color:var(--ink-red); font-family:Ma Shan Zheng">😔 获取愿望失败，请稍后重试</p>';
  }
}

async function submitWish() {
  const content = document.getElementById("input-content").value;
  const name = document.getElementById("input-name").value;
  const is_anonymous = document.getElementById("input-anon").checked;

  if (!content) return alert("愿望不能为空哦");

  if (!_supabase) {
    alert("许愿功能暂不可用");
    return;
  }

  try {
    const { error } = await _supabase.from("wishes").insert([
      {
        content: content,
        name: name,
        is_anonymous: is_anonymous,
      },
    ]);

    if (error) throw error;

    document.getElementById("input-content").value = "";
    toggleModal(false);
    fetchWishes();
  } catch (err) {
    console.error("提交愿望失败:", err);
    alert("寄送失败，你的署名已被使用");
  }
}

const canvas = document.getElementById("firework-canvas");
const ctx = canvas.getContext("2d");
let width, height;
let particles = [];
const colors = [
  { h: 0, s: 90, l: 50 },
  { h: 40, s: 95, l: 50 },
  { h: 20, s: 100, l: 50 },
  { h: 145, s: 85, l: 45 },
  { h: 210, s: 90, l: 50 },
  { h: 280, s: 80, l: 55 },
  { h: 330, s: 90, l: 60 },
];

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.friction = 0.94;
    this.gravity = 0.15;
    this.alpha = 1;
    this.decay = Math.random() * 0.012 + 0.008;
    this.history = [];
    this.historyLimit = Math.floor(Math.random() * 12 + 8);
  }
  update() {
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > this.historyLimit) this.history.shift();
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }
  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < this.history.length - 1; i++) {
      const point = this.history[i];
      const nextPoint = this.history[i + 1];
      const ratio = i / this.history.length;
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${this.alpha * ratio})`;
      ctx.lineWidth = ratio * 3.5;
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
    }
    ctx.beginPath();
    const light = this.alpha > 0.8 ? 85 : this.color.l;
    ctx.fillStyle = `hsla(${this.color.h}, ${this.color.s}%, ${light}%, ${this.alpha})`;
    ctx.arc(this.x, this.y, Math.max(0.6, this.alpha * 1.8), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function explode(x, y) {
  const count = 90;
  const isMultiColor = Math.random() > 0.6;
  const baseColor = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < count; i++) {
    const pColor = isMultiColor
      ? colors[Math.floor(Math.random() * colors.length)]
      : baseColor;
    const finalColor = {
      h: pColor.h + (Math.random() * 10 - 5),
      s: pColor.s,
      l: pColor.l,
    };
    particles.push(new Particle(x, y, finalColor));
  }
}

function loop() {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.alpha <= 0) particles.splice(i, 1);
  }
  requestAnimationFrame(loop);
}

window.addEventListener("pointerdown", (e) => {
  // 优化判定：如果点击的目标本身，或者它的父级链条里有按钮或输入框
  const isInteractive = e.target.closest(
    "button, input, textarea, .modal-content, .message-card",
  );

  if (!isInteractive) {
    explode(e.clientX, e.clientY);
  }
});

setInterval(() => {
  if (particles.length < 400) {
    explode(Math.random() * width, Math.random() * height * 0.5);
  }
}, 1800);

loop();
