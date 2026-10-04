import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  analyzeReviews,
  deleteRestaurant,
  addReview,
} from "../redux/actions/restaurantAction";

const Restaurant = ({ restaurant }) => {
  const dispatch = useDispatch();
  const [showAI, setShowAI] = useState(false);
  const [analyzingReviews, setAnalyzingReviews] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const { isAuthenticated, user } = useSelector(
    (state) => state.user || {}
  );

  //DELETE
  const handleDelete = () => {
    if (!window.confirm("Delete this restaurant?")) return;

    dispatch(deleteRestaurant(restaurant._id)).catch(() => {
      alert("Unable to delete");
    });
  };

  const handleAnalyzeReviews = async () => {
    setAnalyzingReviews(true);
    setAnalysisError("");
    try {
      await dispatch(analyzeReviews(restaurant._id)).unwrap();
      setShowAI(true);
    } catch (error) {
      setAnalysisError(error || "Unable to analyze reviews");
    } finally {
      setAnalyzingReviews(false);
    }
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError("Please enter a review comment.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      await dispatch(
        addReview({
          id: restaurant._id,
          reviewData: {
            name: reviewerName.trim() || user?.name || "Customer",
            rating: Number(rating),
            Comment: comment.trim(),
          },
        })
      ).unwrap();

      setShowReviewModal(false);
      setComment("");
      setRating(5);
      setReviewerName("");
    } catch (err) {
      setReviewError(err || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasReviewSummary = Boolean(restaurant.reviewSentiment);
  const hasReviews = (restaurant.reviews?.length || restaurant.numOfReviews || 0) > 0;

  const handleReviewSummaryClick = () => {
    if (hasReviewSummary) {
      setShowAI((visible) => !visible);
      return;
    }

    handleAnalyzeReviews();
  };

  return (
    <div className="col-12 my-3">
      <div className="card restaurant-card p-3">

        <Link to={`/eats/stores/${restaurant._id}/menus`}>
          <img
            className="restaurant-image"
            src={restaurant.images?.[0]?.url}
            alt={restaurant.name}
          />
        </Link>

        <div className="restaurant-info">

          <h4>{restaurant.name}</h4>

          <p className="rest_address">
            {restaurant.address}
          </p>

          <div className="ratings">
            <div className="rating-outer">
              <div
                className="rating-inner"
                style={{
                  width: `${(restaurant.ratings / 5) * 100}%`,
                }}
              ></div>
            </div>

            <span>
              ({restaurant.numOfReviews} Reviews)
            </span>
          </div>

          <div className="d-flex align-items-center flex-wrap mt-2">
            <button
              className="btn btn-sm btn-outline-success mr-2 mb-1"
              type="button"
              onClick={() => {
                setReviewerName(user?.name || "");
                setShowReviewModal(true);
              }}
            >
              ⭐ Write Review
            </button>

            {hasReviews && (
              <button
                className="ai-btn mb-1"
                type="button"
                onClick={handleReviewSummaryClick}
                disabled={analyzingReviews}
              >
                {analyzingReviews
                  ? "Analyzing reviews..."
                  : showAI
                    ? "➖ Hide Summary"
                    : "💬 View Review Summary"}
              </button>
            )}
          </div>

          {analysisError && (
            <p role="alert" className="text-danger mt-1">
              {analysisError}
            </p>
          )}

        </div>

        {showAI && (
          <div className="ai-insights-box">

            <div className="ai-status">
              Review Summary :
              😊 <strong>
                {restaurant.reviewSentiment}
              </strong>

            </div>

            <ul>
              {(restaurant.reviewSummaryBullets || []).map(
                (point, index) => (
                  <li key={index}>{point}</li>
                )
              )}
            </ul>

            <div className="mentions">
              {(restaurant.reviewTopMentions || []).map(
                (item, index) => (
                  <span
                    key={index}
                    className="mention-tag"
                  >
                    #{item}
                  </span>
                )
              )}
            </div>

          </div>
        )}

      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="create-modal">
          <div className="create-content">
            <h3>Submit Review for {restaurant.name}</h3>

            {reviewError && (
              <p className="text-danger" role="alert">
                {reviewError}
              </p>
            )}

            <form onSubmit={submitReviewHandler}>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your Name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Rating (1 to 5 Stars)</label>
                <select
                  className="form-control"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Terrible</option>
                </select>
              </div>

              <div className="form-group">
                <label>Comment / Food Review</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Share your experience about the food and restaurant..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>

              <button
                className="btn btn-secondary ml-2"
                type="button"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {isAuthenticated && user && user.role === "admin" && (
        <button
          className="btn btn-danger btn-sm mt-2"
          onClick={handleDelete}
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default Restaurant;