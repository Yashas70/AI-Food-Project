const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
    {
        menu: [
            {
                category: {
                    type: String,
                    required: true
                },
                items: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "FoodItem"
                    }
                ]
            }
        ],
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;