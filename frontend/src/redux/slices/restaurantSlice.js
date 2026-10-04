import { createSlice } from "@reduxjs/toolkit";
import { getRestaurants, createRestaurant, deleteRestaurant, analyzeReviews, addReview } from "../actions/restaurantAction";

const initialState = {
    restaurants : [],
    count : 0,
    loading : false,
    error : null,
    showVegOnly : false,
    pureVegRestaurantsCount : 0,
    creating: false,      
    createError: null,
    deleting: false,
    deleteError: null
}

const restaurantSlice = createSlice({
    name: "restaurants",
    initialState,
    reducers : {
        sortByRatings:(state) =>{
            state.restaurants.sort((a,b) => b.ratings - a.ratings);
        },
      sortByReviews: (state) => {
            state.restaurants.sort((a, b) => {
                const reviewsA = a.reviews?.length ?? a.numOfReviews ?? 0;
                const reviewsB = b.reviews?.length ?? b.numOfReviews ?? 0;

                return reviewsB - reviewsA || b.ratings - a.ratings;
            });
        },
        toggleVegOnly:(state) =>{
            state.showVegOnly = !state.showVegOnly;
            state.pureVegRestaurantsCount = calculatePureVegCount(state.restaurants,state.showVegOnly);
        },
        clearError:(state) =>{
            state.error = null;
        }
    },

    extraReducers : (builder) =>{
        builder
        //GET
        .addCase(getRestaurants.pending,(state) =>{
            state.loading = true;
        })
        .addCase(getRestaurants.fulfilled,(state,action) =>{
            state.loading = false;
            state.restaurants = action.payload.restaurants;
            state.count = action.payload.count;
           
        })
        .addCase(getRestaurants.rejected,(state,action) =>{
            state.loading = false;
            state.error = action.payload || "Failed to fetch restaurants";
        })

        // CREATE
        // CREATE
.addCase(createRestaurant.pending, (state) => {
    state.creating = true;
    state.createError = null;
})

.addCase(createRestaurant.fulfilled, (state, action) => {
    state.creating = false;

    state.restaurants.push(action.payload.data);
    state.count += 1;
})

.addCase(createRestaurant.rejected, (state, action) => {
    state.creating = false;
    state.createError = action.payload;
})

// DELETE
.addCase(deleteRestaurant.pending, (state) => {
    state.deleting = true;
    state.deleteError = null;
})

.addCase(deleteRestaurant.fulfilled, (state, action) => {
    state.deleting = false;

    // remove restaurant from state
    state.restaurants = state.restaurants.filter(
        (rest) => rest._id !== action.payload.id
    );

    state.count -= 1;
})

.addCase(deleteRestaurant.rejected, (state, action) => {
    state.deleting = false;
    state.deleteError = action.payload;
})


// ANALYZE REVIEWS
      .addCase(analyzeReviews.fulfilled, (state, action) => {
        const { restaurantId, aiData } = action.payload;

        const restaurant = state.restaurants.find(
          (r) => r._id === restaurantId
        );

        if (restaurant) {
          restaurant.reviewSentiment = aiData.sentiment;
          restaurant.reviewSummaryBullets =
            aiData.summaryBullets;
          restaurant.reviewTopMentions =
            aiData.topMentions;
        }
      })

      // ADD REVIEW
      .addCase(addReview.fulfilled, (state, action) => {
        const { restaurantId, restaurant } = action.payload;
        const index = state.restaurants.findIndex(
          (r) => r._id === restaurantId
        );
        if (index !== -1 && restaurant) {
          state.restaurants[index] = {
            ...state.restaurants[index],
            ...restaurant,
          };
        }
      });
     }

})

export const {
    sortByRatings,
    sortByReviews,
    toggleVegOnly,
    clearError,
    
    
} = restaurantSlice.actions;

export default restaurantSlice.reducer;

//helper 
const calculatePureVegCount = (restaurants,showVegOnly) =>{

    if(!showVegOnly)return restaurants.length;

    return restaurants.filter(restaurant => restaurant.isVeg).length;
}