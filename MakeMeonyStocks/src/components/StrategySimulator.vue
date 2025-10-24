<script setup lang="ts">
import { useAppStore } from "../store";
const { state, setStrategy, simulate } = useAppStore();
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
        <label>補倉價格</label>
        <input type="number" v-model.number="(state.strategy as any).params.addPrice" />
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
  </section>
</template>