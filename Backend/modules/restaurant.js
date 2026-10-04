const mongoose=require('mongoose');

const restaurantSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter restaurant name"],
        trim:true,
        maxLength:[100,"Restaurant name cannot exceed 100 characters"]
    },
    isVeg:{
        type:Boolean,
        default:false,
        required:[true,"Please provide address of restaurant"]
    },
    address:{
        type:String,
        required:[true,"Please provide address of restaurant"]
    },
    ratings:{
        type:Number,
        default:0
    },
    numberOfReviews:{
        type:Number,
        default:0
    },
    location:{
        type:{
            type:String,
            enum:["    Point"],
            required:true,
        },
        coordinates:{
            type:[Number],
            required:true
        }
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
    images:
    [
        {
            public_id:{
                type:String,
                required:true
            },
            url:{
            type:String,
            required:true
            }
        }
    ],
    createdAt:{
    type:Date,
    default:Date.now
    }
})

restaurantSchema.index({location:"2dsphere"});
restaurantSchema.index({address:"text"});

module.exports=mongoose.model("Restaurant",restaurantSchema);