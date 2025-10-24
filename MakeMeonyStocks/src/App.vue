<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useAppStore } from "./store";
import DiagnosticMonitor from "./components/DiagnosticMonitor.vue";
import StrategySimulator from "./components/StrategySimulator.vue";
import ExecutionPlan from "./components/ExecutionPlan.vue";
import ReviewEvolution from "./components/ReviewEvolution.vue";
import { playStepDone } from "./utils/audio";

const { state, meta, diagnose, nextToSimulate, setStrategy, simulate, savePlan, loadReviews } = useAppStore();

// Step inputs
const symbol = ref<string>(meta.symbol);
const costPrice = ref<number>(meta.costPrice);
const quantity = ref<number>(meta.quantity);
const portfolioValue = ref<number>(meta.portfolioValue);

watch([symbol, costPrice, quantity, portfolioValue], ([s, c, q, pv]) => {
  meta.symbol = s.trim().toUpperCase();
  meta.costPrice = Number(c);
  meta.quantity = Number(q);
  meta.portfolioValue = Number(pv);
});

onMounted(() => { loadReviews(); });

// Badge and audio on stage change
const showBadge = ref(false);
watch(() => state.stage, () => {
  showBadge.value = true;
  playStepDone();
  setTimeout(() => (showBadge.value = false), 1200);
});
</script>

<template>
  <main class="phoenix">
    <header class="hero">
      <h1>Phoenix Project</h1>
      <p>From Ashes to Assets · 頭寸優化終端（最小可執行）</p>
    </header>

    <transition name="fade" mode="out-in">
      <section class="card" v-if="state.stage === 'diagnose'">
        <h2>Step 1 · 診斷</h2>
        <div class="grid">
          <div>
            <label>股票代碼</label>
            <input v-model="symbol" placeholder="如 AAPL" />
          </div>
          <div>
            <label>成本價</label>
            <input type="number" v-model.number="costPrice" />
          </div>
          <div>
            <label>持倉股數</label>
            <input type="number" v-model.number="quantity" />
          </div>
          <div>
            <label>總資產（USD）</label>
            <input type="number" v-model.number="portfolioValue" />
          </div>
        </div>
        <button class="primary" @click="diagnose">開始診斷</button>

        <DiagnosticMonitor v-if="state.diagnostics" />
        <button class="primary" v-if="state.diagnostics" @click="nextToSimulate">進入策略模擬</button>
      </section>
    </transition>

    <transition name="fade" mode="out-in">
      <StrategySimulator v-if="state.stage === 'simulate' && state.diagnostics" />
    </transition>

    <transition name="fade" mode="out-in">
      <ExecutionPlan v-if="state.stage === 'plan' && state.simulation" />
    </transition>

    <transition name="fade" mode="out-in">
      <ReviewEvolution v-if="state.stage === 'review'" />
    </transition>

    <div class="badge" v-if="showBadge">✅ Step Done</div>
  </main>
</template>

<style>
:root { --bg: #0b0e12; --card: #12161c; --text: #d9e0ea; --muted: #8b97a8; --accent: #4dc6ff; --profit: #29c36a; --loss: #ff5c72; }
* { box-sizing: border-box; }
html, body, #app { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, system-ui, -apple-system, Segoe UI, Microsoft YaHei, sans-serif; }

.phoenix { max-width: 1000px; margin: 0 auto; padding: 24px; }
.hero { text-align: center; margin-bottom: 16px; }
.hero h1 { margin: 0; font-size: 28px; letter-spacing: 0.5px; }
.hero p { margin: 6px 0 0; color: var(--muted); }

.card { background: var(--card); border: 1px solid #1b2027; border-radius: 14px; padding: 16px; margin-bottom: 14px; }
.card h2 { margin: 0 0 12px; font-size: 18px; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.grid input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #2a313b; background: #0f141a; color: var(--text); }

.primary { margin-top: 10px; padding: 10px 14px; border: none; border-radius: 12px; background: var(--accent); color: #05212f; font-weight: 700; cursor: pointer; }
.primary:hover { filter: brightness(1.05); }

.info { padding-top: 8px; }
.info-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.value { margin-top: 4px; font-size: 16px; }
.value.profit { color: var(--profit); }
.value.loss { color: var(--loss); }
.tag { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #17202a; border: 1px solid #2a313b; text-transform: uppercase; font-size: 12px; }
.tag.healthy { color: #29c36a; border-color: #29c36a33; }
.tag.subhealthy { color: #ffd166; border-color: #ffd16633; }
.tag.crisis { color: #ff5c72; border-color: #ff5c7233; }

.tabs { display: flex; gap: 8px; margin-bottom: 10px; }
.tabs button { flex: none; padding: 8px 10px; border-radius: 10px; border: 1px solid #2a313b; background: #0f141a; color: var(--text); }
.tabs button.active { border-color: var(--accent); color: var(--accent); }

.warn { margin: 8px 0 0; padding-left: 18px; color: #ffd166; }

.timeline { display: grid; gap: 10px; }
.item { border-left: 3px solid #2a313b; padding-left: 10px; }
.item .row { display: flex; gap: 12px; align-items: center; }
.item .time { color: var(--muted); font-size: 12px; }
.item .note { margin-top: 4px; color: var(--muted); }

.monitor-wrap { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-top: 12px; }
.monitor { background: #061410; border: 1px solid #123726; border-radius: 14px; padding: 12px; position: relative; box-shadow: inset 0 0 30px #0a1f16; }
.monitor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; color: #29c36a; }
.monitor-title { font-weight: 700; letter-spacing: 0.5px; }
.monitor-status { display: flex; align-items: center; gap: 8px; font-size: 12px; text-transform: uppercase; color: #8b97a8; }
.light { width: 10px; height: 10px; border-radius: 999px; display: inline-block; box-shadow: 0 0 10px currentColor; }
.light.green { color: #29c36a; }
.light.amber { color: #ffd166; }
.light.red { color: #ff5c72; }
.monitor-body canvas { width: 100%; height: auto; display: block; background: #05120d; border-radius: 10px; }
.monitor-footer { margin-top: 8px; display: flex; justify-content: space-between; color: #8b97a8; font-size: 12px; }

.monitor-side { display: grid; gap: 10px; }
.panel { background: #0f141a; border: 1px solid #22303a; border-radius: 12px; padding: 10px; }
.panel h3 { margin: 0 0 6px; font-size: 14px; color: var(--muted); }
.compact { margin: 0; padding-left: 18px; }
.compact .comment { margin-top: 4px; color: var(--muted); }

.gauge { border: 1px solid #22303a; border-radius: 10px; padding: 8px; }
.gauge .gauge-bar { height: 8px; background: linear-gradient(90deg, #ff5c72, #ffd166, #29c36a); border-radius: 6px; }
.gauge-labels { display: flex; justify-content: space-between; color: #8b97a8; font-size: 12px; margin-top: 4px; }
.gauge-summary { margin-top: 4px; color: #8b97a8; font-size: 12px; }

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .info-row { grid-template-columns: 1fr 1fr; }
  .monitor-wrap { grid-template-columns: 1fr; }
  .monitor-body canvas { height: 140px; }
}
</style>

/* Add fade transitions and badge styles */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.badge { position: fixed; top: 14px; right: 14px; background: #17202a; border: 1px solid #2a313b; color: var(--accent); padding: 8px 10px; border-radius: 999px; box-shadow: 0 0 12px #4dc6ff55; z-index: 10; }