import { Issue, Operation } from '../../types';
import { formatNumber } from '../numerals';

/**
 * Prompt 1 Check 4 + Prompt 5.5 Profit Margin Drop:
 * - Average sell price per gram < average buy price per gram for the same day or nearest day (high).
 * - Profit margin drop > 30% compared to usual average margin across days (medium).
 */
export function checkSellBelowBuyCost(operations: Operation[]): Issue[] {
  const issues: Issue[] = [];

  const byDate: Record<
    string,
    { buyWeight: number; buyTotal: number; sellWeight: number; sellTotal: number }
  > = {};

  for (const op of operations) {
    if ((op.kind !== 'buy' && op.kind !== 'sell') || op.weightG <= 0 || op.total <= 0) continue;
    if (!byDate[op.date]) {
      byDate[op.date] = { buyWeight: 0, buyTotal: 0, sellWeight: 0, sellTotal: 0 };
    }
    if (op.kind === 'buy') {
      byDate[op.date].buyWeight += op.weightG;
      byDate[op.date].buyTotal += op.total;
    } else {
      byDate[op.date].sellWeight += op.weightG;
      byDate[op.date].sellTotal += op.total;
    }
  }

  const dates = Object.keys(byDate).sort();
  const dailyMargins: { date: string; margin: number }[] = [];

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    const stat = byDate[d];
    if (stat.sellWeight <= 0) continue;

    const avgSell = stat.sellTotal / stat.sellWeight;
    let avgBuy = stat.buyWeight > 0 ? stat.buyTotal / stat.buyWeight : 0;
    let refBuyDate = d;

    // If no buy on the same day, find nearest day with buy
    if (avgBuy === 0) {
      let bestDist = Infinity;
      for (const otherDate of dates) {
        if (byDate[otherDate].buyWeight > 0) {
          const dist = Math.abs(new Date(d).getTime() - new Date(otherDate).getTime());
          if (dist < bestDist) {
            bestDist = dist;
            avgBuy = byDate[otherDate].buyTotal / byDate[otherDate].buyWeight;
            refBuyDate = otherDate;
          }
        }
      }
    }

    if (avgBuy > 0) {
      const margin = avgSell - avgBuy;
      dailyMargins.push({ date: d, margin });

      if (avgSell < avgBuy) {
        const lossPerGram = avgBuy - avgSell;
        issues.push({
          id: `sell-below-buy-${d}`,
          severity: 'high',
          checkType: 'sell_below_buy',
          checkTitle: 'بيع أقل من تكلفة الشراء',
          date: d,
          kind: 'sell',
          message: `متوسط سعر بيع الجرام (${formatNumber(avgSell, 0)}) أقل من متوسط تكلفة شراء الجرام (${formatNumber(avgBuy, 0)}${refBuyDate !== d ? ` ليوم ${refBuyDate}` : ''}) بخسارة ${formatNumber(lossPerGram, 0)} ج.م/جرام.`,
          expected: `>= ${formatNumber(avgBuy, 0)} ج.م`,
          actual: `${formatNumber(avgSell, 0)} ج.م`,
          difference: `-${formatNumber(lossPerGram, 0)} ج.م/جرام`,
        });
      }
    }
  }

  // Prompt 5.5: Check if positive profit margin dropped suddenly by > 30% compared to usual positive margin
  const positiveMargins = dailyMargins.filter((m) => m.margin > 0);
  if (positiveMargins.length >= 3) {
    const avgMargin =
      positiveMargins.reduce((acc, item) => acc + item.margin, 0) / positiveMargins.length;
    for (const item of positiveMargins) {
      if (avgMargin > 20 && item.margin < avgMargin * 0.7) {
        const dropPct = ((avgMargin - item.margin) / avgMargin) * 100;
        issues.push({
          id: `margin-drop-${item.date}`,
          severity: 'medium',
          checkType: 'profit_margin_drop',
          checkTitle: 'انخفاض مفاجئ في هامش الربح',
          date: item.date,
          kind: 'sell',
          message: `هامش ربح الجرام اليومي (${formatNumber(item.margin, 0)} ج.م) انخفض بنسبة ${dropPct.toFixed(0)}% عن المعتاد (${formatNumber(avgMargin, 0)} ج.م/جرام).`,
          expected: `${formatNumber(avgMargin, 0)} ج.م/جرام`,
          actual: `${formatNumber(item.margin, 0)} ج.م/جرام`,
          difference: `-${dropPct.toFixed(0)}%`,
        });
      }
    }
  }

  return issues;
}
