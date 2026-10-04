const catchAsync = require("../middlewares/catchAsyncErrors");
const aiService = require("../services/ai.service")
const FoodItem = require("../models/foodItem");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

const Restaurant = require("../models/restaurant");
const {analyzeReviewsWithAI}= require("../services/aiReviewAnalyzer")

exports.generateFoodAI = catchAsync(async (req, res) => {
  const { name, category, spiceLevel, price } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Dish name is required to generate AI description",
    });
  }

  const aiData = await aiService.generateDishDescription({
    name: name.trim(),
    category:
      typeof category === "string" && category.trim()
        ? category.trim()
        : "Main Course",
    spiceLevel:
      typeof spiceLevel === "string" && spiceLevel.trim()
        ? spiceLevel.trim()
        : "Medium",
    price:
      Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : 0,
  });

  res.status(200).json({
    success: true,
    data: aiData,
  });
});

exports.generateAndSaveFoodAI = catchAsync(async(req,res) =>{
    const {foodId} = req.params;

    const food = await FoodItem.findById(foodId);
    if(!food){
        return res.status(404).json({
            success:false,
            message:"Food item not found"
        })
    }

    const aiData = await aiService.generateDishDescription({
        name: food.name,
        category:food.category || "Veg",
        spiceLevel:food.spiceLevel || "Medium",
        price:food.price
    })

    food.aiDescription = aiData.description;
    food.aiTags = aiData.tags;
    food.aiAllergens = aiData.allergens;
    food.aiServes = aiData.serves;
    food.aiBestFor = aiData.bestFor;
    await food.save();
    res.status(200).json({
        success:true,
        message:"AI metadata generated and saved",
        data:aiData,
    })
})

exports.analyzeRestaurantReviews = catchAsync(async(req,res) =>{
    const {id} = req.params;
    const restaurant = await Restaurant.findById(id);

    if(!restaurant) {
      return res.status(404).json({message:"Restaurant not found"})
    }

    let aiData;
    if (!restaurant.reviews || !restaurant.reviews.length) {
      aiData = {
        sentiment: restaurant.ratings >= 4 ? "positive" : "mixed",
        summaryBullets: [
          `Customers love the authentic dishes and quality ingredients at ${restaurant.name}.`,
          `Rated ${restaurant.ratings || 4.5} stars out of 5 by local diners.`,
          `Highly recommended for delicious food and pleasant dining experience.`
        ],
        topMentions: ["tasty", "fresh", "quality", "service"]
      };
    } else {
      try {
        aiData = await analyzeReviewsWithAI(restaurant.reviews);
      } catch (error) {
        console.error("AI Review Analysis Error:", error.message);
        return res.status(502).json({
          success: false,
          message: error.message,
        });
      }
    }

    restaurant.reviewSentiment = aiData.sentiment;
    restaurant.reviewSummaryBullets = aiData.summaryBullets;
    restaurant.reviewTopMentions = aiData.topMentions;

    await restaurant.save();
    res.status(200).json({success:true, aiData})
})



exports.addReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { name, rating, Comment } = req.body;

  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  // Add Review
  restaurant.reviews.push({
    name,
    rating,
    Comment,
  });

  // Update Review Count
  restaurant.numOfReviews =
    restaurant.reviews.length;

  // Update Average Rating
  const totalRatings =
    restaurant.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

  restaurant.ratings =
    totalRatings / restaurant.reviews.length;

  // AI Review Analysis
  try {
    const aiData = await analyzeReviewsWithAI(
      restaurant.reviews
    );

    restaurant.reviewSentiment =
      aiData.sentiment;

    restaurant.reviewSummaryBullets =
      aiData.summaryBullets;

    restaurant.reviewTopMentions =
      aiData.topMentions;
  } catch (error) {
    console.log(
      "AI Analysis Failed:",
      error.message
    );
  }

  await restaurant.save();

  res.status(200).json({
    success: true,
    message: "Review Added Successfully",
    restaurant,
  });
});