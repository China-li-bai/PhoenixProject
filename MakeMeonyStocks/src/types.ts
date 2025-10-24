// Project-wide data schema for Phoenix Project (position optimization)

export type SymbolId = string;

export type HealthStatus = "healthy" | "subhealthy" | "crisis";
export type StepStage = "diagnose" | "simulate" | "plan" | "review";
export type StrategyKind = "supplement" | "swap" | "hold";

export interface Quote {
  symbol: SymbolId;
  price: number; // latest traded price
  currency?: string;
  time?: string; // ISO string
}

export interface Fundamentals {
  symbol: SymbolId;
  roe?: number; // Return on Equity
  debtRatio?: number; // Debt/Assets
  revenueYoY?: number; // Revenue growth YoY
  health: HealthStatus; // simplified tri-state health lamp
  comment?: string; // brief summary
}

export interface Sentiment {
  symbol: SymbolId;
  score: number; // -1 (fear) .. +1 (greed)
  popularity?: number; // 0..100 heat
  summary?: string;
}

export interface Position {
  symbol: SymbolId;
  costPrice: number; // average cost per share
  quantity: number; // shares
  date?: string; // acquisition start date
}

export interface Diagnostics {
  symbol: SymbolId;
  quote: Quote | null;
  fundamentals: Fundamentals | null;
  sentiment: Sentiment | null;
  position: Position;
}

export interface SupplementParams {
  addQuantity: number; // shares to add
  addPrice: number; // expected add price
}

export interface SwapParams {
  sellQuantity: number; // shares to sell
  targetSymbol: SymbolId;
  targetExpectedReturnPct?: number; // simple expectation
}

export interface HoldParams {
  horizonDays?: number;
}

export type StrategyParams =
  | { kind: "supplement"; params: SupplementParams }
  | { kind: "swap"; params: SwapParams }
  | { kind: "hold"; params: HoldParams };

export interface SimulationInput {
  position: Position;
  quote: Quote | null;
  strategy: StrategyParams;
}

export interface CurvePoint {
  price: number;
  pnl: number;
}

export interface SimulationResult {
  breakEvenPrice: number;
  profitLoss: number; // at current price
  profitLossPct: number; // relative to total cost
  exposureChangePct?: number; // risk delta when supplement/swap
  curve?: CurvePoint[]; // simple P/L curve for optimistic/neutral/pessimistic ranges
  warnings?: string[]; // risk messages
  // added for enhanced supplement scenario visualization
  riskCoefficient?: number; // 0..100 composite risk metric
  targetPrice?: number; // suggested take-profit reference
  stopPrice?: number; // suggested stop-loss reference
}

export interface PlanAction {
  label: string; // e.g. "Buy 100 @ 8.50"
  triggerPrice: number;
  action: "BUY" | "SELL";
  quantity: number;
}

export interface ExecutionPlan {
  actions: PlanAction[];
  stopLoss?: number; // dynamic stop price
  takeProfit?: number; // target take-profit price
}

export interface ReviewRecord {
  timestamp: string;
  decision: StrategyKind;
  resultPnl?: number;
  attribution?: {
    beta?: number; // market
    alpha?: number; // stock-specific
    emotion?: number; // 0..100 emotional bias
    execution?: number; // 0..100 execution quality
  };
  notes?: string;
}

export interface AppState {
  stage: StepStage;
  diagnostics: Diagnostics | null;
  strategy: StrategyParams | null;
  simulation: SimulationResult | null;
  plan: ExecutionPlan | null;
  reviews: ReviewRecord[];
}