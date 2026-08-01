import mongoose from 'mongoose'

// This schema mirrors the "Daily Tracker" sheet from MeatbyAlvi_Business_Tracker.xlsx
// exactly — same fields, same formulas:
//   Total Delivery Cost   = Orders * Delivery Cost/Order        (=B2*E2)
//   Total Packaging Cost  = Orders * Packaging Cost/Order       (=B2*G2)
//   Total Expenses        = Delivery + Packaging + Ads + Other  (=F2+H2+I2+J2)
//   Net Profit/Loss       = Gross Profit - Total Expenses       (=D2-K2)
const entrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      // Only one entry per calendar day — keeps the tracker 1 row per day, like the sheet.
      index: true
    },
    orders: {
      type: Number,
      required: [true, 'Orders is required'],
      min: [0, 'Orders cannot be negative']
    },
    revenue: {
      type: Number,
      required: [true, 'Revenue is required'],
      min: [0, 'Revenue cannot be negative']
    },
    grossProfit: {
      type: Number,
      required: [true, "Today's Orders Profit (Gross) is required"]
    },
    deliveryCostPerOrder: {
      type: Number,
      default: 0,
      min: [0, 'Delivery cost per order cannot be negative']
    },
    packagingCostPerOrder: {
      type: Number,
      default: 0,
      min: [0, 'Packaging cost per order cannot be negative']
    },
    adsExpense: {
      type: Number,
      default: 0,
      min: [0, 'Ads expense cannot be negative']
    },
    otherExpenses: {
      type: Number,
      default: 0,
      min: [0, 'Other expenses cannot be negative']
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },

    // ── Computed & stored fields (recalculated on every save) ──
    totalDeliveryCost: { type: Number, default: 0 },
    totalPackagingCost: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfitLoss: { type: Number, default: 0 }
  },
  { timestamps: true }
)

// Recompute derived fields every time an entry is saved (create or update via .save()).
entrySchema.pre('save', function (next) {
  this.totalDeliveryCost = this.orders * this.deliveryCostPerOrder
  this.totalPackagingCost = this.orders * this.packagingCostPerOrder
  this.totalExpenses =
    this.totalDeliveryCost + this.totalPackagingCost + this.adsExpense + this.otherExpenses
  this.netProfitLoss = this.grossProfit - this.totalExpenses
  next()
})

// Also recompute on findOneAndUpdate (used by the PUT /:id route), since pre('save')
// does not fire for query-based updates.
entrySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate()
  const $set = update.$set || update

  // Need the merged view of "existing doc + incoming changes" to recompute correctly.
  this.model.findOne(this.getQuery()).then((existing) => {
    if (!existing) return next()

    const orders = $set.orders ?? existing.orders
    const deliveryCostPerOrder = $set.deliveryCostPerOrder ?? existing.deliveryCostPerOrder
    const packagingCostPerOrder = $set.packagingCostPerOrder ?? existing.packagingCostPerOrder
    const adsExpense = $set.adsExpense ?? existing.adsExpense
    const otherExpenses = $set.otherExpenses ?? existing.otherExpenses
    const grossProfit = $set.grossProfit ?? existing.grossProfit

    const totalDeliveryCost = orders * deliveryCostPerOrder
    const totalPackagingCost = orders * packagingCostPerOrder
    const totalExpenses = totalDeliveryCost + totalPackagingCost + adsExpense + otherExpenses
    const netProfitLoss = grossProfit - totalExpenses

    this.setUpdate({
      ...update,
      $set: {
        ...$set,
        totalDeliveryCost,
        totalPackagingCost,
        totalExpenses,
        netProfitLoss
      }
    })
    next()
  }).catch(next)
})

const Entry = mongoose.model('Entry', entrySchema)

export default Entry
