<script setup lang="ts">
import { useAppStore } from "../store";
const { state } = useAppStore();
</script>

<template>
  <section class="card" v-if="state.stage === 'review'">
    <h2>Step 4 · 復盤與進化</h2>
    <div v-if="!state.reviews.length" class="muted">尚無復盤記錄</div>
    <div class="timeline">
      <div class="item" v-for="r in state.reviews" :key="r.timestamp">
        <div class="row">
          <span class="tag">{{ r.decision }}</span>
          <span class="time">{{ new Date(r.timestamp).toLocaleString() }}</span>
        </div>
        <div class="row">
          <span>結果盈虧：<b :class="(r.resultPnl ?? 0) >= 0 ? 'profit' : 'loss'">{{ r.resultPnl?.toLocaleString() }}</b></span>
          <span>執行力：{{ r.attribution?.execution ?? 0 }}</span>
          <span>情緒化：{{ r.attribution?.emotion ?? 0 }}</span>
        </div>
        <div class="note">{{ r.notes }}</div>
      </div>
    </div>
  </section>
</template>