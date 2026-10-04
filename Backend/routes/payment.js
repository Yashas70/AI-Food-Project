const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const {
  processPayment,
  sendStripApi,
} = require("../controllers/paymentController");

router.route("/payment/process").post(authController.protect, processPayment);
router.route("/stripeapi").get(authController.protect, sendStripApi);

module.exports = router;
