const Order = require("../models/order");
const FoodItem = require("../models/foodItem");
const Cart = require("../models/cartModel");
const { ObjectId } = require("mongodb");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const getStripeClient = require("../utils/stripeClient");

// Create a new order   =>  /api/v1/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const { session_id } = req.body;
  if (!session_id) {
    return next(new ErrorHandler("Checkout session ID is required", 400));
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (
    session.payment_status !== "paid" ||
    session.client_reference_id !== String(req.user._id) ||
    session.metadata?.userId !== String(req.user._id)
  ) {
    return next(new ErrorHandler("A paid checkout session for this user is required", 400));
  }

  const existingOrder = await Order.findOne({
    "paymentInfo.id": session.payment_intent,
  });
  if (existingOrder) {
    return res.status(200).json({ success: true, order: existingOrder });
  }

  const cart = await Cart.findOne({
    _id: session.metadata.cartId,
    user: req.user._id,
  });
  if (!cart) {
    return next(new ErrorHandler("The cart for this checkout was not found", 404));
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });
  const orderItems = await Promise.all(
    lineItems.data.map(async (lineItem) => {
      const product = lineItem.price?.product;
      const foodItemId =
        typeof product === "object" && product !== null
          ? product.metadata?.foodItemId
          : null;
      if (!foodItemId || !Number.isInteger(lineItem.quantity) || lineItem.quantity < 1) {
        throw new ErrorHandler("Checkout session contains an invalid item", 400);
      }

      const foodItem = await FoodItem.findById(foodItemId);
      if (!foodItem) {
        throw new ErrorHandler("A food item from this checkout no longer exists", 400);
      }
      const image = foodItem.images?.[0]?.url;
      if (!image) {
        throw new ErrorHandler("A food item from this checkout has no image", 400);
      }

      return {
        name: foodItem.name,
        quantity: lineItem.quantity,
        image,
        price: lineItem.amount_total / lineItem.quantity / 100,
        fooditem: foodItem._id,
      };
    })
  );

  const address = session.shipping_details?.address;
  const phoneNo = session.customer_details?.phone;
  if (!address || !phoneNo || !session.payment_intent) {
    return next(new ErrorHandler("Checkout is missing required delivery or payment details", 400));
  }

  const order = await Order.create({
    orderItems,
    deliveryInfo: {
      address: [address.line1, address.line2].filter(Boolean).join(" "),
      city: address.city,
      phoneNo,
      postalCode: address.postal_code,
      country: address.country,
    },
    paymentInfo: {
      id: session.payment_intent,
      status: session.payment_status,
    },
    deliveryCharge: (session.shipping_cost?.amount_total || 0) / 100,
    itemsPrice: session.amount_subtotal / 100,
    finalTotal: session.amount_total / 100,
    user: req.user._id,
    restaurant: session.metadata.restaurantId,
    paidAt: new Date(session.created * 1000),
  });

  await Cart.deleteOne({ _id: cart._id, user: req.user._id });

  res.status(200).json({
    success: true,
    order,
  });
});

// Get single order   =>   /api/v1/orders/:id
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("restaurant")
    .exec();

  if (!order) {
    return next(new ErrorHandler("No Order found with this ID", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// Get logged in user orders   =>   /api/v1/orders/me
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  // Get the user ID from req.user
  const userId = new ObjectId(req.user.id);
  // Find orders for the specific user using the retrieved user ID
  const orders = await Order.find({ user: userId })
    .populate("user", "name email")
    .populate("restaurant")
    .exec();

  res.status(200).json({
    success: true,
    orders,
  });
});

// Get all orders - ADMIN  =>   /api/v1/admin/orders/
exports.allOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.finalTotal;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});
