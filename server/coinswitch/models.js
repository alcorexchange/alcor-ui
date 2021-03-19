import mongoose from 'mongoose'

export const Order = mongoose.models.Match || mongoose.model('CSOrders', mongoose.Schema({
  orderId: { type: String, index: true },

  creator: { type: String, index: true }, // EOS or destination account if loggined
  device_id: { type: String, index: true }, // User session

  depositCoin: { type: String, index: true },
  depositCoinAmount: { type: Number },

  destinationCoin: { type: String, index: true },
  destinationAddress: {
    address: { type: String, index: true },
    tag: { type: String, index: true }
  },

  exchangeAddress: {
    address: { type: String, index: true },
    tag: { type: String, index: true }
  },

  expectedDepositCoinAmount: { type: Number },
  expectedDestinationCoinAmount: { type: Number },
  inputTransactionHash: { type: String, index: true },
  outputTransactionHash: { type: String, index: true },

  status: { type: String, index: true },
  userReferenceId: { type: Number, index: true },

  validTill: { type: Date, index: true },
  createdAt: { type: Date, index: true }
}))
