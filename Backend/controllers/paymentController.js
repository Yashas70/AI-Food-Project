const Cart = require("../models/cartModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const getStripeClient = require("../utils/stripeClient");

exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.foodItem",
    select: "name price images stock",
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Your cart is empty",
    });
  }
  if (!cart.restaurant) {
    return res.status(400).json({
      success: false,
      message: "Your cart is missing restaurant information",
    });
  }

  const lineItems = cart.items.map((item) => {
    const foodItem = item.foodItem;
    if (!foodItem) {
      throw new ErrorHandler("A food item in your cart no longer exists", 400);
    }
    const unitAmount = Math.round(foodItem.price * 100);

    if (
      !Number.isFinite(foodItem.price) ||
      unitAmount < 1 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > foodItem.stock
    ) {
      throw new ErrorHandler(`Invalid cart item: ${foodItem.name}`, 400);
    }

    const imageUrl = foodItem.images?.[0]?.url;
    const productData = {
      name: foodItem.name,
      metadata: { foodItemId: String(foodItem._id) },
    };
    if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
      productData.images = [imageUrl];
    }

    return {
      price_data: {
        currency: "inr",
        product_data: productData,
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });

  if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not configured on the server");
  }

  const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, "");
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    client_reference_id: String(req.user._id),
    metadata: {
      userId: String(req.user._id),
      cartId: String(cart._id),
      restaurantId: String(cart.restaurant),
    },
    customer_email: req.user.email,
    phone_number_collection: { enabled: true },
    line_items: lineItems,
    mode: "payment",
    shipping_address_collection: {
      allowed_countries: ["US", "IN"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery Charges",
          type: "fixed_amount",
          fixed_amount: {
            amount: 5500,
            currency: "inr",
          },
          delivery_estimate: {
            minimum: { unit: "hour", value: 1 },
            maximum: { unit: "hour", value: 3 },
          },
        },
      },
    ],
    success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/cart`,
  });

  res.status(200).json({ url: session.url });
});

exports.sendStripApi = catchAsyncErrors(async (req, res) => {
  if (!process.env.STRIPE_API_KEY) {
    return res.status(503).json({
      success: false,
      message: "Stripe is not configured on the server",
    });
  }

  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});
