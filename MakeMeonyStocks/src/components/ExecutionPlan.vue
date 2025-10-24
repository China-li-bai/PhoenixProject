<script setup lang="ts">
import { useAppStore } from "../store";
const { state, savePlan } = useAppStore();
</script>

<template>
  <section class="card" v-if="state.stage === 'plan' && state.simulation">
    <h2>Step 3 · 執行計劃</h2>
    <div class="grid">
      <div>
        <strong>回本價</strong>
        <div class="value">{{ state.simulation.breakEvenPrice.toFixed(4) }}</div>
      </div>
      <div>
        <strong>當前盈虧</strong>
        <div class="value" :class="state.simulation.profitLoss >= 0 ? 'profit' : 'loss'">{{ state.simulation.profitLoss.toLocaleString() }}</div>
      </div>
      <div>
        <strong>盈虧比例</strong>
        <div class="value" :class="state.simulation.profitLossPct >= 0 ? 'profit' : 'loss'">{{ state.simulation.profitLossPct }}%</div>
      </div>
      <div>
        <strong>風險敞口變化</strong>
        <div class="value">{{ state.simulation.exposureChangePct ?? 0 }}%</div>
      </div>
    </div>
    <ul class="warn" v-if="state.simulation.warnings?.length">
      <li v-for="w in state.simulation.warnings" :key="w">⚠️ {{ w }}</li>
    </ul>
    <button class="primary" @click="savePlan">保存計劃並設置提醒</button>
  </section>
</template>