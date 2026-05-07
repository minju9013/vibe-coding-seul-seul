const mongoose = require('mongoose');
const { getStatus } = require('../utils/getStatus');

// Mongoose Schema 생성에 사용할 헬퍼
const { Schema } = mongoose;

// 아이템별 현재 재고 상태를 저장하는 스키마
const stockSchema = new Schema(
  {
    // 어떤 아이템의 재고인지 (Item 컬렉션 참조)
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    // 현재 남아 있는 수량 (0 이상, 기본값 0)
    quantity: { type: Number, default: 0, min: 0 },
    // Item 과 동기화되는 부족 기준 (재계산 시 사용)
    lowStockThreshold: { type: Number, default: 1, min: 1, max: 99 },
    // 재고 상태: 충분 / 부족 / 소진 (getStatus 로 자동 계산)
    status: {
      type: String,
      enum: ['충분', '부족', '소진'],
    },
    // 하루 평균 소진량 (수량 변경 이력으로부터 자동 계산)
    consumptionRate: { type: Number },
    // 현재 수량과 소진 속도로 계산한 예상 소진일
    estimatedRunOut: { type: Date },
    // 마지막으로 재고 수량이 갱신된 시각
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    // createdAt, updatedAt 자동 관리
    timestamps: true,
  },
);

// 하루를 ms 로 환산한 상수
const DAY_MS = 1000 * 60 * 60 * 24;

// 저장 직전에 자동으로 상태 및 관련 필드를 갱신하는 훅
stockSchema.pre('save', async function preSave(next) {
  const now = new Date();

  const th = this.lowStockThreshold ?? 1;
  this.status = getStatus(this.quantity ?? 0, th);
  this.lastUpdated = now;

  // 새 문서가 아니고, quantity 가 변경된 경우에만 소진 속도 계산
  if (!this.isNew && this.isModified('quantity')) {
    try {
      // 이전 값 조회 (lean() 으로 plain object 로 받음)
      const previous = await this.constructor.findById(this._id).lean();

      if (previous && typeof previous.quantity === 'number' && previous.lastUpdated) {
        const quantityDiff = previous.quantity - this.quantity;
        const daysDiff = (now - previous.lastUpdated) / DAY_MS;

        // 수량이 줄었고, 실제로 시간이 흘렀을 때만 소진 속도 계산
        if (quantityDiff > 0 && daysDiff > 0) {
          const ratePerDay = quantityDiff / daysDiff;
          this.consumptionRate = ratePerDay;

          // 소진 속도와 남은 수량이 있을 때만 예상 소진일 계산
          if (ratePerDay > 0 && this.quantity > 0) {
            const daysLeft = this.quantity / ratePerDay;
            this.estimatedRunOut = new Date(now.getTime() + daysLeft * DAY_MS);
          }
        }
      }
    } catch (err) {
      return next(err);
    }
  }

  return next();
});

// Stock 컬렉션으로 등록
module.exports = mongoose.model('Stock', stockSchema);

