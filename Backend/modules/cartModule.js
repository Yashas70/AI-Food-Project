const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    items: [{
        foodItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodItem',
            required: true
        },
        
    
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart ;