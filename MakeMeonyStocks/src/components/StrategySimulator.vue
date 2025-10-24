<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "../store";
const { state, setStrategy, simulate, proceedToPlan } = useAppStore();

const chartWidth = 600;
const chartHeight = 140;
const padding = 10;

const curvePath = computed(() => {
  const pts = state.simulation?.curve || [];
  if (!pts.length) return "";
  const minPrice = Math.min(...pts.map(p => p.price));
  const maxPrice = Math.max(...pts.map(p => p.price));
  const minPnl = Math.min(...pts.map(p => p.pnl));
  const maxPnl = Math.max(...pts.map(p => p.pnl));
  const w = chartWidth - padding * 2;
  const h = chartHeight - padding * 2;
  const xFor = (price: number) => padding + ((price - minPrice) / Math.max(1e-6, (maxPrice - minPrice))) * w;
  const yFor = (pnl: number) => chartHeight - padding - ((pnl - minPnl) / Math.max(1e-6, (maxPnl - minPnl))) * h;
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(p.price)},${yFor(p.pnl)}`).join(" ");
});

const band = computed(() => {
  if (state.strategy?.kind !== "supplement") return null as any;
  const addPrice = (state.strategy as any).params.addPrice as number;
  const pts = state.simulation?.curve || [];
  if (!pts.length) return null as any;
  const minPrice = Math.min(...pts.map(p => p.price));
  const maxPrice = Math.max(...pts.map(p => p.price));
  const w = chartWidth - padding * 2;
  const bandMin = addPrice * 0.97;
  const bandMax = addPrice * 1.03;
  const xFor = (price: number) => padding + ((price - minPrice) / Math.max(1e-6, (maxPrice - minPrice))) * w;
  const x1 = xFor(Math.max(minPrice, bandMin));
  const x2 = xFor(Math.min(maxPrice, bandMax));
  return { x: Math.min(x1, x2), width: Math.abs(x2 - x1) };
});
</script>

<template>
  <section class="card" v-if="state.stage === 'simulate' && state.diagnostics">
    <h2>Step 2 · 策略模擬</h2>
    <div class="tabs">
      <button :class="{'active': state.strategy?.kind==='hold'}" @click="setStrategy('hold')">靜觀其變</button>
      <button :class="{'active': state.strategy?.kind==='supplement'}" @click="setStrategy('supplement')">戰術性補倉</button>
      <button :class="{'active': state.strategy?.kind==='swap'}" @click="setStrategy('swap')">換股重組</button>
    </div>

    <div v-if="state.strategy?.kind==='supplement'" class="grid">
      <div>
        <label>補倉股數</label>
        <input type="number" v-model.number="(state.strategy as any).params.addQuantity" />
      </div>
      <div>
        <label>補倉價格（中心）</label>
        <input type="number" v-model.number="(state.strategy as any).params.addPrice" />
        <div class="muted">區間以中心 ±3% 可視化</div>
      </div>
    </div>

    <div v-if="state.strategy?.kind==='swap'" class="grid">
      <div>
        <label>賣出股數</label>
        <input type="number" v-model.number="(state.strategy as any).params.sellQuantity" />
      </div>
      <div>
        <label>目標標的</label>
        <input v-model="(state.strategy as any).params.targetSymbol" />
      </div>
    </div>

    <button class="primary" @click="simulate">運行模擬</button>

    <div v-if="state.simulation" class="sim-wrap">
      <div class="grid">
        <div>
          <strong>回本價</strong>
          <div class="value">{{ state.simulation.breakEvenPrice.toFixed(4) }}</div>
        </div>
        <div>
          <strong>目標/止損</strong>
          <div class="value">TP {{ state.simulation.targetPrice?.toFixed(4) }} / SL {{ state.simulation.stopPrice?.toFixed(4) }}</div>
        </div>
        <div>
          <strong>當前盈虧</strong>
          <div class="value" :class="state.simulation.profitLoss >= 0 ? 'profit' : 'loss'">{{ state.simulation.profitLoss.toLocaleString() }}</div>
        </div>
        <div>
          <strong>風險係數</strong>
          <div class="value">{{ state.simulation.riskCoefficient ?? 0 }}</div>
        </div>
      </div>

      <div class="chart">
        <svg :width="chartWidth" :height="chartHeight">
          <rect x="0" y="0" :width="chartWidth" :height="chartHeight" fill="#05120d" stroke="#123726" rx="8"/>
          <g>
            <!-- band shading -->
            <rect v-if="band" :x="band.x" y="10" :width="band.width" :height="chartHeight-20" fill="#29c36a22" stroke="#29c36a55" rx="6" />
            <!-- curve path -->
            <path :d="curvePath" stroke="#4dc6ff" fill="none" stroke-width="2" />
          </g>
        </svg>
        <div class="muted">綠色區域為預估補倉區間，藍線為盈虧曲線。</div>
      </div>

      <div class="actions">
        <button class="primary" @click="proceedToPlan">下一步：生成計劃</button>
      </div>
    </div>
  </section>
</template>