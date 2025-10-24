import type {
  Position,
  Quote,
  SimulationInput,
  SimulationResult,
  StrategyParams,
  CurvePoint,
} from "../types";

export function breakEvenPrice(position: Position): number {
  return position.costPrice; // in MVP we use current average cost
}

export function pnlAtPrice(position: Position, price: number): number {
  const totalCost = position.costPrice * position.quantity;
  const currentValue = price * position.quantity;
  return Number((currentValue - totalCost).toFixed(2));
}

export function pnlPct(position: Position, price: number): number {
  const totalCost = position.costPrice * position.quantity;
  if (totalCost === 0) return 0;
  return Number(((pnlAtPrice(position, price) / totalCost) * 100).toFixed(2));
}

function curve(position: Position, centerPrice: number): CurvePoint[] {
  const points: number[] = [
    centerPrice * 0.8,
    centerPrice * 0.9,
    centerPrice,
    centerPrice * 1.1,
    centerPrice * 1.2,
  ];
  return points.map((p) => ({ price: Number(p.toFixed(2)), pnl: pnlAtPrice(position, p) }));
}

function supplement(position: Position, quote: Quote | null, addQty: number, addPrice: number): SimulationResult {
  const newQty = position.quantity + addQty;
  const newCost = (position.costPrice * position.quantity + addQty * addPrice) / newQty;
  const currentPrice = quote?.price ?? position.costPrice;
  const resultPnl = Number(((currentPrice - newCost) * newQty).toFixed(2));
  const exposureChangePct = Number(((newQty - position.quantity) / position.quantity * 100).toFixed(2));
  const warnings: string[] = [];
  if (exposureChangePct > 30) warnings.push(`補倉使風險敞口增加 ${exposureChangePct}%`);
  if (addPrice > currentPrice) warnings.push("在更高價格補倉恐提高回本難度");
  return {
    breakEvenPrice: Number(newCost.toFixed(4)),
    profitLoss: resultPnl,
    profitLossPct: Number(((resultPnl / (newCost * newQty)) * 100).toFixed(2)),
    exposureChangePct,
    curve: curve({ ...position, costPrice: newCost, quantity: newQty }, currentPrice),
    warnings,
  };
}

function swap(position: Position, quote: Quote | null, sellQty: number): SimulationResult {
  const currentPrice = quote?.price ?? position.costPrice;
  const remainQty = Math.max(0, position.quantity - sellQty);
  const reducedExposurePct = Number(((sellQty / position.quantity) * 100).toFixed(2));
  const remainPnl = Number(((currentPrice - position.costPrice) * remainQty).toFixed(2));
  const warnings: string[] = [];
  if (remainQty === 0) warnings.push("完全退出：請確保換入標的與風險承受一致");
  return {
    breakEvenPrice: position.costPrice,
    profitLoss: remainPnl,
    profitLossPct: Number(((remainPnl / (position.costPrice * Math.max(remainQty, 1))) * 100).toFixed(2)),
    exposureChangePct: -reducedExposurePct,
    curve: curve({ ...position, quantity: remainQty }, currentPrice),
    warnings,
  };
}

function hold(position: Position, quote: Quote | null): SimulationResult {
  const currentPrice = quote?.price ?? position.costPrice;
  const resultPnl = pnlAtPrice(position, currentPrice);
  const warnings: string[] = [];
  return {
    breakEvenPrice: position.costPrice,
    profitLoss: resultPnl,
    profitLossPct: pnlPct(position, currentPrice),
    exposureChangePct: 0,
    curve: curve(position, currentPrice),
    warnings,
  };
}

export function runSimulation(input: SimulationInput): SimulationResult {
  const { position, quote, strategy } = input;
  switch (strategy.kind) {
    case "supplement":
      return supplement(position, quote, strategy.params.addQuantity, strategy.params.addPrice);
    case "swap":
      return swap(position, quote, strategy.params.sellQuantity);
    case "hold":
      return hold(position, quote);
    default:
      return hold(position, quote);
  }
}