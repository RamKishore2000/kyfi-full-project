const {
  getSubscriptionSettings,
  updateSubscriptionSettings,
  createSubscriptionOrder,
  verifySubscriptionPayment,
} = require("../services/subscription.service");

async function getPublicSubscription(req, res, next) {
  try {
    const subscription = await getSubscriptionSettings();

    return res.status(200).json({ subscription });
  } catch (error) {
    return next(error);
  }
}

async function getAdminSubscription(req, res, next) {
  try {
    const subscription = await getSubscriptionSettings();

    return res.status(200).json({ subscription });
  } catch (error) {
    return next(error);
  }
}

async function updateAdminSubscription(req, res, next) {
  try {
    const { yearlyPrice } = req.body || {};
    const subscription = await updateSubscriptionSettings({
      yearlyPrice,
      updatedByAdminId: req.user?.dealerId || null,
    });

    return res.status(200).json({
      message: "Subscription price updated successfully",
      subscription,
    });
  } catch (error) {
    return next(error);
  }
}

async function createPublicSubscriptionOrder(req, res, next) {
  try {
    const { dealerId, mobile } = req.body || {};

    const order = await createSubscriptionOrder({
      dealerId: Number(dealerId),
      mobile: typeof mobile === "string" ? mobile.trim() : "",
    });

    return res.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
}

async function verifyPublicSubscriptionPayment(req, res, next) {
  try {
    const {
      dealerId,
      mobile,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body || {};

    const result = await verifySubscriptionPayment({
      dealerId: Number(dealerId),
      mobile: typeof mobile === "string" ? mobile.trim() : "",
      razorpayOrderId: typeof razorpayOrderId === "string" ? razorpayOrderId.trim() : "",
      razorpayPaymentId: typeof razorpayPaymentId === "string" ? razorpayPaymentId.trim() : "",
      razorpaySignature: typeof razorpaySignature === "string" ? razorpaySignature.trim() : "",
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPublicSubscription,
  getAdminSubscription,
  updateAdminSubscription,
  createPublicSubscriptionOrder,
  verifyPublicSubscriptionPayment,
};
