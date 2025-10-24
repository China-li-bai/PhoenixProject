import { defineStore } from "pinia";
import type {
  AppState,
  Position,
  StrategyParams,
  ExecutionPlan,
  PlanAction,
} from "./types";
import { getDiagnostics } from "./services/data";
import { runSimulation } from "./utils/simulation";

export const useAppStore = defineStore("app", {
  state: () => ({
    state: {
      stage: "diagnose",
      diagnostics: null,
      strategy: { kind: "hold", params: {} } as StrategyParams | null,
      simulation: null,
      plan: null,
      reviews: [],
    } as AppState,
    meta: {
      symbol: "AAPL",
      costPrice: 120,
      quantity: 100,
      portfolioValue: 100000,
    },
  }),
  actions: {
    setStage(stage: AppState["stage"]) {
      this.state.stage = stage;
    },
    async diagnose() {
      const position: Position = {
        symbol: this.meta.symbol.trim().toUpperCase(),
        costPrice: Number(this.meta.costPrice),
        quantity: Number(this.meta.quantity),
      };
      this.state.diagnostics = await getDiagnostics(position);
      this.state.stage = "diagnose"; // 留在Step1以展示監護儀
    },
    nextToSimulate() {
      this.state.stage = "simulate";
    },
    setStrategy(kind: StrategyParams["kind"]) {
      const price = this.state.diagnostics?.quote?.price ?? this.meta.costPrice;
      const qty = this.state.diagnostics?.position.quantity ?? this.meta.quantity;
      if (kind === "supplement") this.state.strategy = { kind, params: { addQuantity: 100, addPrice: Number((price * 0.95).toFixed(2)) } } as StrategyParams;
      else if (kind === "swap") this.state.strategy = { kind, params: { sellQuantity: Math.floor(qty * 0.3), targetSymbol: "MSFT" } } as StrategyParams;
      else this.state.strategy = { kind, params: {} } as StrategyParams;
    },
    simulate() {
      if (!this.state.diagnostics || !this.state.strategy) return;
      this.state.simulation = runSimulation({
        position: this.state.diagnostics.position,
        quote: this.state.diagnostics.quote,
        strategy: this.state.strategy,
      });
      this.state.stage = "plan";
    },
    buildDefaultPlan(): ExecutionPlan | null {
      if (!this.state.diagnostics || !this.state.simulation) return null;
      const be = this.state.simulation.breakEvenPrice;
      const qty = this.state.diagnostics.position.quantity;
      const actions: PlanAction[] = [
        { label: `補倉 ${Math.floor(qty * 0.2)} 股`, triggerPrice: Number((be * 0.9).toFixed(2)), action: "BUY", quantity: Math.floor(qty * 0.2) },
        { label: `減倉 ${Math.floor(qty * 0.3)} 股`, triggerPrice: Number((be * 1.1).toFixed(2)), action: "SELL", quantity: Math.floor(qty * 0.3) },
      ];
      return { actions, stopLoss: Number((be * 0.85).toFixed(2)), takeProfit: Number((be * 1.15).toFixed(2)) };
    },
    savePlan() {
      this.state.plan = this.buildDefaultPlan();
      if (!this.state.plan || !this.state.diagnostics || !this.state.simulation) return;
      const record = {
        timestamp: new Date().toISOString(),
        decision: this.state.strategy?.kind ?? "hold",
        resultPnl: this.state.simulation.profitLoss,
        attribution: { beta: 50, alpha: 30, emotion: 20, execution: 70 },
        notes: "完成計劃保存，進入閉環。",
      };
      this.state.reviews.unshift(record);
      localStorage.setItem("phoenix_reviews", JSON.stringify(this.state.reviews));
      localStorage.setItem("phoenix_last_plan", JSON.stringify(this.state.plan));
      localStorage.setItem("phoenix_last_diagnostics", JSON.stringify(this.state.diagnostics));
      localStorage.setItem("phoenix_last_simulation", JSON.stringify(this.state.simulation));
      this.state.stage = "review";
    },
    loadReviews() {
      try {
        const saved = localStorage.getItem("phoenix_reviews");
        this.state.reviews = saved ? JSON.parse(saved) : [];
      } catch {}
    },
  },
});