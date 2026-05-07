// 재고(Stock) 관련 비즈니스 로직
const Item = require('../models/Item');
const Stock = require('../models/Stock');
const StockHistory = require('../models/StockHistory');
const { getStatus } = require('../utils/getStatus');

const DAY_MS = 1000 * 60 * 60 * 24;

// PUT /api/stocks/:itemId
// - quantity 를 받아 해당 아이템의 재고를 업데이트
// - 변경 이력을 StockHistory 에 저장
// - 최근 10개의 감소 이력 기준으로 consumptionRate, estimatedRunOut 계산
async function updateStock(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'quantity 값이 필요합니다.' });
    }

    const nextQuantity = Number(quantity);
    if (Number.isNaN(nextQuantity) || nextQuantity < 0) {
      return res.status(400).json({ message: 'quantity는 0 이상의 숫자여야 합니다.' });
    }

    const itemDoc = await Item.findById(itemId).lean();
    const threshold = itemDoc?.lowStockThreshold ?? 1;

    // 기존 재고 찾기 (없으면 0에서 시작한다고 가정)
    let stock = await Stock.findOne({ item: itemId });
    const now = new Date();

    if (!stock) {
      stock = new Stock({
        item: itemId,
        quantity: 0,
        lowStockThreshold: threshold,
        status: getStatus(0, threshold),
        lastUpdated: now,
      });
    }

    const quantityBefore = stock.quantity ?? 0;
    const quantityAfter = nextQuantity;

    stock.quantity = quantityAfter;
    stock.lowStockThreshold = threshold;
    stock.status = getStatus(quantityAfter, threshold);
    stock.lastUpdated = now;

    // 변경 이력 저장
    await StockHistory.create({
      item: itemId,
      quantityBefore,
      quantityAfter,
      changedAt: now,
    });

    // 최근 10개 이력 기준으로 하루 평균 소진량 계산 (수량 감소한 이력만)
    const histories = await StockHistory.find({ item: itemId })
      .sort({ changedAt: -1 })
      .limit(10)
      .lean();

    const decreasing = histories
      .filter((h) => h.quantityAfter < h.quantityBefore)
      .sort((a, b) => a.changedAt - b.changedAt); // 오래된 것부터 순서대로

    let consumptionRate;

    if (decreasing.length >= 1) {
      const first = decreasing[0];
      const last = decreasing[decreasing.length - 1];

      const totalConsumed = decreasing.reduce(
        (sum, h) => sum + (h.quantityBefore - h.quantityAfter),
        0,
      );

      const totalDays = (last.changedAt - first.changedAt) / DAY_MS || 0;

      if (totalConsumed > 0 && totalDays > 0) {
        consumptionRate = totalConsumed / totalDays;
      }
    }

    if (consumptionRate && consumptionRate > 0) {
      stock.consumptionRate = consumptionRate;

      if (quantityAfter > 0) {
        const daysLeft = quantityAfter / consumptionRate;
        stock.estimatedRunOut = new Date(now.getTime() + daysLeft * DAY_MS);
      } else {
        stock.estimatedRunOut = null;
      }
    }

    await stock.save();

    // 클라이언트가 카드 한 개를 갱신하기에 충분한 평탄한 형태로 응답
    const item = itemDoc && itemDoc._id ? itemDoc : await Item.findById(itemId).lean();
    if (!item) {
      return res.json({
        id: String(itemId),
        quantity: stock.quantity,
        status: stock.status,
        consumptionRate: stock.consumptionRate ?? null,
        estimatedRunOut: stock.estimatedRunOut ?? null,
        lastUpdated: stock.lastUpdated,
      });
    }

    res.json({
      id: String(item._id),
      name: item.name,
      categoryId: item.categoryId,
      image: item.image || null,
      imagePublicId: item.imagePublicId || null,
      unit: item.unit || '개',
      lowStockThreshold: item.lowStockThreshold ?? 1,
      notes: item.notes || '',
      order: item.order ?? null,
      quantity: stock.quantity,
      status: stock.status,
      consumptionRate: stock.consumptionRate ?? null,
      estimatedRunOut: stock.estimatedRunOut ?? null,
      lastUpdated: stock.lastUpdated,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateStock,
};

