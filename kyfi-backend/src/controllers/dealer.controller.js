const { createDealer, findDealerByMobile } = require("../services/dealer.service");

const registerDealer = async (req, res, next) => {
  const {
    ownerName,
    name,
    mobile,
    password,
    shopName,
    district,
    state,
    mandal,
    village,
    aadhaarOrGstNumber,
  } = req.body || {};
  const dealerName = ownerName || name;

  if (!dealerName || !mobile || !shopName || !district || !state || !mandal || !village || !aadhaarOrGstNumber) {
    return res.status(400).json({
      message: "All dealer registration fields are required",
    });
  }

  try {
    const existingDealer = await findDealerByMobile(mobile);

    if (existingDealer) {
      return res.status(409).json({
        message: "Mobile number already exists",
      });
    }

    const dealer = await createDealer({
      role: "dealer",
      name: dealerName,
      mobile,
      password,
      shopName,
      district,
      state,
      mandal,
      village,
      aadhaarOrGstNumber,
      status: "pending",
    });

    return res.status(201).json({
      message: "Registration successful",
      dealer,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerDealer,
};
