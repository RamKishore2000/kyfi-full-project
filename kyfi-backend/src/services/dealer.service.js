const bcrypt = require("bcrypt");
const db = require("../config/db");

const findDealerByMobile = async (mobile) => {
  const [rows] = await db.execute(
    "SELECT id, role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, otp_code, created_at, updated_at FROM dealers WHERE mobile = ? LIMIT 1",
    [mobile],
  );

  return rows[0] || null;
};

const createDealer = async ({
  role,
  name,
  mobile,
  password,
  shopName,
  district,
  state,
  mandal,
  village,
  aadhaarOrGstNumber,
  status,
}) => {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const [result] = await db.execute(
    `INSERT INTO dealers
      (role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, otp_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [role, name, mobile, passwordHash, shopName, district, state, mandal, village, aadhaarOrGstNumber, status],
  );

  return {
    id: result.insertId,
    role,
    name,
    mobile,
    passwordHash,
    shopName,
    district,
    state,
    mandal,
    village,
    aadhaarOrGstNumber,
    status,
  };
};

module.exports = {
  findDealerByMobile,
  createDealer,
};
