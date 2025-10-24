<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from "vue";
import { useAppStore } from "../store";

const { state, meta } = useAppStore();
const pulseCanvas = ref<HTMLCanvasElement | null>(null);
const pulsePoints = ref<number[]>([]);
let raf = 0;

function generatePulseSeries(base: number, n = 240): number[] {
  const points: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    const noise = (Math.sin(i / 12) + Math.sin(i / 33)) * 0.4;
    const jitter = (Math.random() - 0.5) * 0.6;
    v = v + noise + jitter;
    points.push(v);
  }
  return points;
}

function drawPulse() {
  const canvas = pulseCanvas.value;
  if (!canvas || !state.diagnostics) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  // grid
  ctx.strokeStyle = "rgba(77,198,255,0.18)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // scale
  const min = Math.min(...pulsePoints.value);
  const max = Math.max(...pulsePoints.value);
  const range = Math.max(1e-3, max - min);
  // breathing glow
  const t = Date.now() / 800;
  const glow = 0.5 + 0.5 * Math.sin(t);
  ctx.strokeStyle = `rgba(77,198,255,${0.6 + glow * 0.3})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < pulsePoints.value.length; i++) {
    const x = (i / (pulsePoints.value.length - 1)) * w;
    const y = h - ((pulsePoints.value[i] - min) / range) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function tick() {
  if (!state.diagnostics) return;
  const base = state.diagnostics.quote?.price ?? state.diagnostics.position.costPrice;
  const last = pulsePoints.value[pulsePoints.value.length - 1] ?? base;
  const noise = (Math.sin(Date.now() / 600) + Math.sin(Date.now() / 1100)) * 0.3;
  const jitter = (Math.random() - 0.5) * 0.6;
  const next = last + noise + jitter;
  pulsePoints.value.push(next);
  if (pulsePoints.value.length > 240) pulsePoints.value.shift();
  drawPulse();
  raf = requestAnimationFrame(tick);
}

function start() {
  cancelAnimationFrame(raf);
  const base = state.diagnostics?.quote?.price ?? meta.costPrice;
  pulsePoints.value = generatePulseSeries(base);
  drawPulse();
  raf = requestAnimationFrame(tick);
}

onUnmounted(() => cancelAnimationFrame(raf));

watch(() => state.diagnostics, (d) => { if (d) start(); });

const positionValue = computed(() => {
  const price = state.diagnostics?.quote?.price ?? null;
  const qty = state.diagnostics?.position.quantity ?? null;
  if (price == null || qty == null) return 0;
  return Number((price * qty).toFixed(2));
});

const exposureRatio = computed(() => {
  const pv = positionValue.value;
  return meta.portfolioValue ? Number(((pv / meta.portfolioValue) * 100).toFixed(2)) : 0;
});

const technical = computed(() => {
  const price = state.diagnostics?.quote?.price ?? meta.costPrice;
  const cp = state.diagnostics?.position.costPrice ?? meta.costPrice;
  const support = Number((Math.min(cp * 0.95, price * 0.97)).toFixed(2));
  const resistance = Number((Math.max(cp * 1.05, price * 1.03)).toFixed(2));
  const hash = Math.abs((state.diagnostics?.symbol || "A").split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 100;
  const drift50 = ((hash % 10) - 5) / 100;
  const drift200 = ((hash % 6) - 3) / 100;
  const ma50 = Number((price * (1 + drift50)).toFixed(2));
  const ma200 = Number((price * (1 + drift200)).toFixed(2));
  const trend = ma50 > ma200 ? "上升" : ma50 < ma200 ? "下降" : "盤整";
  return { support, resistance, ma50, ma200, trend };
});

const currentStatus = computed(() => {
  const price = state.diagnostics?.quote?.price ?? null;
  const cost = state.diagnostics?.position.costPrice ?? null;
  if (price == null || cost == null) return "—";
  const diff = price - cost;
  return diff >= 0 ? `盈利 +${diff.toFixed(2)}` : `虧損 ${diff.toFixed(2)}`;
});
</script>

<template>
  <div class="monitor-wrap" v-if="state.diagnostics">
    <div class="monitor">
      <div class="monitor-header">
        <div class="monitor-title">{{ state.diagnostics.symbol }} 監護儀</div>
        <div class="monitor-status">
          <span class="light" :class="state.diagnostics.fundamentals?.health === 'healthy' ? 'green' : state.diagnostics.fundamentals?.health === 'subhealthy' ? 'amber' : 'red'"></span>
          <span class="light-text">{{ state.diagnostics.fundamentals?.health }}</span>
        </div>
      </div>
      <div class="monitor-body">
        <canvas ref="pulseCanvas" width="720" height="180"></canvas>
      </div>
      <div class="monitor-footer">
        <span>當前價：{{ state.diagnostics.quote?.price?.toFixed(2) ?? '—' }} {{ state.diagnostics.quote?.currency ?? '' }}</span>
        <span>盈虧狀態：<b :class="(state.diagnostics.quote?.price ?? 0) - (state.diagnostics.position.costPrice ?? 0) >= 0 ? 'profit' : 'loss'">{{ currentStatus }}</b></span>
      </div>
    </div>

    <div class="monitor-side">
      <div class="panel">
        <h3>基本面</h3>
        <ul class="compact">
          <li>ROE：{{ state.diagnostics.fundamentals?.roe }}%</li>
          <li>負債率：{{ (state.diagnostics.fundamentals?.debtRatio ?? 0) * 100 }}%</li>
          <li>營收增長：{{ (state.diagnostics.fundamentals?.revenueYoY ?? 0) * 10 }}%</li>
          <li class="comment">{{ state.diagnostics.fundamentals?.comment }}</li>
        </ul>
      </div>
      <div class="panel">
        <h3>技術面脈搏</h3>
        <ul class="compact">
          <li>支撐位：{{ technical.support }}</li>
          <li>壓力位：{{ technical.resistance }}</li>
          <li>MA50：{{ technical.ma50 }} · MA200：{{ technical.ma200 }}</li>
          <li>均線狀態：{{ technical.trend }}</li>
        </ul>
      </div>
      <div class="panel">
        <h3>市場情緒</h3>
        <div class="gauge">
          <div class="gauge-bar" :style="{ width: (((state.diagnostics.sentiment?.score ?? 0) + 1) * 50) + '%' }"></div>
          <div class="gauge-labels"><span>恐懼</span><span>貪婪</span></div>
          <div class="gauge-summary">{{ state.diagnostics.sentiment?.summary }} · 熱度 {{ state.diagnostics.sentiment?.popularity }}</div>
        </div>
      </div>
      <div class="panel">
        <h3>頭寸 X 光</h3>
        <ul class="compact">
          <li>持倉市值：{{ positionValue.toLocaleString() }}</li>
          <li>總資產：{{ meta.portfolioValue.toLocaleString() }}</li>
          <li>倉位占比：<b :class="exposureRatio >= 50 ? 'loss' : 'profit'">{{ exposureRatio }}%</b></li>
        </ul>
      </div>
    </div>
  </div>
</template>