import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../../redux/actions/orderActions";
import { clearErrors } from "../../redux/slices/orderSlice";
import { toast } from "react-toastify";

const OrderSuccess = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const hasCalled = useRef(false); //prevent double call

  const { error, order, loading } = useSelector((state) => state.order);

  const searchParams = new URLSearchParams(location.search);
  const session_id = searchParams.get("session_id");

  useEffect(() => {
    if (!session_id || hasCalled.current) return;

    hasCalled.current = true;

    dispatch(createOrder(session_id));
  }, [dispatch, session_id]);

  const retryOrderCreation = () => {
    hasCalled.current = false;
    dispatch(clearErrors());
    dispatch(createOrder(session_id));
  };

  useEffect(() => {
    if (order) {
      toast.success("Order placed successfully 🎉", {
        position: "bottom-right",
      });
    }

    if (error) {
      toast.error(error, { position: "bottom-right" });
      dispatch(clearErrors());
    }
  }, [order, error, dispatch]);

  return (
    <div className="row justify-content-center">
      <div className="col-6 mt-5 text-center">
        {loading ? (
          <h2>Confirming your payment and creating your order...</h2>
        ) : error ? (
          <>
            <h2>Payment completed, but the order is not confirmed yet.</h2>
            <p role="alert" className="text-danger">{error}</p>
            {session_id && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={retryOrderCreation}
              >
                Retry order confirmation
              </button>
            )}
            <div className="mt-3">
              <Link to="/eats/orders/me/myOrders">Check my orders</Link>
            </div>
          </>
        ) : order ? (
          <>
            <svg
              className="checkmark"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 52 52"
            >
              <circle
                className="checkmark__circle"
                cx="26"
                cy="26"
                r="25"
                fill="none"
              />
              <path
                className="checkmark__check"
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>
            <h2>Your Order has been placed successfully.</h2>
            <Link to="/eats/orders/me/myOrders">Go to Orders</Link>
          </>
        ) : !session_id ? (
          <>
            <h2>Checkout session was not found.</h2>
            <Link to="/cart">Return to cart</Link>
          </>
        ) : (
          <h2>Preparing your order confirmation...</h2>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;