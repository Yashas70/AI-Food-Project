const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter food item name"],
        trim: true,
        maxLength: [100, "Food item name cannot exceed 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Please enter food item description"]
    },
    price: {
        type: Number,
        required: [true, "Please enter food item price"],
        maxLength: [5, "Food item price cannot exceed 5 digits"],
        default: 0.0
    },
    category: {
        type: String,
        required: [true, "Please enter food item category"]
    },
    ratings: {
        type: Number,
        default: 0
    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }

        }
    ],
    menu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu"
    },
    stock: {
        type: Number,
        required: [true, "Please enter food item stock"],
        maxLength: [5, "Food item stock cannot exceed more than 5 digits"],
        default: 0,
    },
    restaurant: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    reviews:[
        {
            name:{
                type:String,
                required:true
            },
            rating:{
                type:Number,
                required:true
            },
            comment:{
                type:String,
                required:true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("FoodItem", foodItemSchema);
//foodItems