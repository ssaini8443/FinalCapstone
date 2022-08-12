const mongoose = require('mongoose')
const Schema = mongoose.Schema

const orderSchema = new Schema({
    address: { type: String, required: true },
    mobile: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required: true},
    products: { type: Object, required: true },
    paymentType: { type: String, default: 'cod' },
    orderStatus: { type: String, default: 'order_placed' },
    timestamp: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Order', orderSchema)