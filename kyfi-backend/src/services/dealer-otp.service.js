const crypto = require("crypto");
const db = require("../config/db");
const { findDealerByMobile } = require("./dealer.service");

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;
const OTP_REQUEST_WINDOW_MINUTES = 15;
const OTP_MAX_REQUESTS_PER_WINDOW = 5;
const TEST_OTP = "111111";
const OTP_TEST_MODE = process.env.KYFI_OTP_TEST_MODE !== "false";

const getDealerIdColumnDefinition = async () => {
  const [rows] = await db.execute(
    `SELECT COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'dealers'
       AND COLUMN_NAME = 'id'
     LIMIT 1`,
  );

  const columnType = String(rows[0]?.COLUMN_TYPE || "").toLowerCase();
  if (columnType.includes("bigint")) {
    return "BIGINT UNSIGNED";
  }

  return "INT UNSIGNED";
};

const ensureOtpTable = async () => {
  const dealerIdType = await getDealerIdColumnDefinition();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS dealer_otp_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      dealer_id ${dealerIdType} NOT NULL,
      mobile VARCHAR(20) NOT NULL,
      otp_code VARCHAR(16) NOT NULL,
      verification_status ENUM('pending', 'verified', 'expired', 'locked') NOT NULL DEFAULT 'pending',
      expires_at DATETIME NOT NULL,
      verified_at DATETIME DEFAULT NULL,
      attempt_count INT NOT NULL DEFAULT 0,
      resend_count INT NOT NULL DEFAULT 0,
      last_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_dealer_otp_mobile_status (mobile, verification_status),
      KEY idx_dealer_otp_expires_at (expires_at),
      CONSTRAINT fk_dealer_otp_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
    )`,
  );
};

const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

const findLatestOtpRequestByMobile = async (mobile) => {
  await ensureOtpTable();
  const [rows] = await db.execute(
    `SELECT id, dealer_id, mobile, otp_code, verification_status, expires_at, verified_at,
            attempt_count, resend_count, last_sent_at, created_at, updated_at
     FROM dealer_otp_requests
     WHERE mobile = ?
     ORDER BY id DESC
     LIMIT 1`,
    [mobile],
  );

  return rows[0] || null;
};

const countOtpRequestsInWindow = async (mobile) => {
  await ensureOtpTable();
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM dealer_otp_requests
     WHERE mobile = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL ${OTP_REQUEST_WINDOW_MINUTES} MINUTE)`,
    [mobile],
  );

  return Number(rows[0]?.count || 0);
};

const createOrResendDealerOtp = async (mobile) => {
  await ensureOtpTable();

  const dealer = await findDealerByMobile(mobile);
  if (!dealer) {
    const error = new Error("Invalid phone number");
    error.statusCode = 404;
    throw error;
  }

  const latestRequest = await findLatestOtpRequestByMobile(mobile);

  if (latestRequest && latestRequest.verification_status === "pending") {
    const lastSentAt = new Date(latestRequest.last_sent_at).getTime();
    if (Number.isFinite(lastSentAt)) {
      const elapsedSeconds = (Date.now() - lastSentAt) / 1000;
      if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
        const error = new Error(
          `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds)} seconds before requesting another OTP`,
        );
        error.statusCode = 429;
        throw error;
      }
    }
  }

  const recentRequestCount = await countOtpRequestsInWindow(mobile);
  if (recentRequestCount >= OTP_MAX_REQUESTS_PER_WINDOW) {
    const error = new Error("Too many OTP requests. Please try again later.");
    error.statusCode = 429;
    throw error;
  }

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  if (latestRequest && latestRequest.verification_status === "pending") {
    await db.execute(
      `UPDATE dealer_otp_requests
       SET otp_code = ?,
           verification_status = 'pending',
           expires_at = ?,
           verified_at = NULL,
           attempt_count = 0,
           resend_count = resend_count + 1,
           last_sent_at = NOW()
       WHERE id = ?`,
      [otpCode, expiresAt, latestRequest.id],
    );

    return {
      dealer,
      otpRequest: {
        ...latestRequest,
        otp_code: otpCode,
        verification_status: "pending",
        expires_at: expiresAt,
        verified_at: null,
        attempt_count: 0,
        resend_count: (latestRequest.resend_count || 0) + 1,
        last_sent_at: new Date(),
      },
      otpCode,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      isResend: true,
    };
  }

  const [result] = await db.execute(
    `INSERT INTO dealer_otp_requests
      (dealer_id, mobile, otp_code, verification_status, expires_at, verified_at, attempt_count, resend_count, last_sent_at)
     VALUES (?, ?, ?, 'pending', ?, NULL, 0, 0, NOW())`,
    [dealer.id, mobile, otpCode, expiresAt],
  );

  return {
    dealer,
    otpRequest: {
      id: result.insertId,
      dealer_id: dealer.id,
      mobile,
      otp_code: otpCode,
      verification_status: "pending",
      expires_at: expiresAt,
      verified_at: null,
      attempt_count: 0,
      resend_count: 0,
      last_sent_at: new Date(),
    },
    otpCode,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    isResend: false,
  };
};

const lockOtpRequest = async (otpRequestId) => {
  await ensureOtpTable();
  await db.execute(
    `UPDATE dealer_otp_requests
     SET verification_status = 'locked'
     WHERE id = ?`,
    [otpRequestId],
  );
};

const markOtpRequestVerified = async (otpRequestId) => {
  await ensureOtpTable();
  await db.execute(
    `UPDATE dealer_otp_requests
     SET verification_status = 'verified',
         verified_at = NOW()
     WHERE id = ?`,
    [otpRequestId],
  );
};

const expireOtpRequest = async (otpRequestId) => {
  await ensureOtpTable();
  await db.execute(
    `UPDATE dealer_otp_requests
     SET verification_status = 'expired'
     WHERE id = ? AND verification_status = 'pending'`,
    [otpRequestId],
  );
};

const incrementOtpAttempt = async (otpRequestId, nextAttemptCount) => {
  await ensureOtpTable();
  await db.execute(
    `UPDATE dealer_otp_requests
     SET attempt_count = ?,
         verification_status = CASE WHEN ? >= ? THEN 'locked' ELSE verification_status END
     WHERE id = ?`,
    [nextAttemptCount, nextAttemptCount, OTP_MAX_ATTEMPTS, otpRequestId],
  );
};

const verifyDealerOtp = async (mobile, otpCode) => {
  await ensureOtpTable();

  const dealer = await findDealerByMobile(mobile);
  if (!dealer) {
    const error = new Error("Invalid phone number or OTP");
    error.statusCode = 401;
    throw error;
  }

  const enteredOtp = String(otpCode || "").trim();

  if (OTP_TEST_MODE && enteredOtp !== TEST_OTP) {
    const error = new Error("Invalid phone number or OTP");
    error.statusCode = 401;
    throw error;
  }

  const latestRequest = await findLatestOtpRequestByMobile(mobile);

  if (!latestRequest) {
    // TODO: Remove test OTP 111111 after SMS provider keys are added.
    const created = await createOrResendDealerOtp(mobile);
    await markOtpRequestVerified(created.otpRequest.id);

    return {
      dealer,
      otpRequest: {
        ...created.otpRequest,
        verification_status: "verified",
        verified_at: new Date(),
      },
      isTestOtp: true,
    };
  }

  if (latestRequest.verification_status === "locked") {
    const error = new Error("Too many incorrect OTP attempts. Request a new OTP.");
    error.statusCode = 429;
    throw error;
  }

  if (latestRequest.verification_status === "verified") {
    return {
      dealer,
      otpRequest: latestRequest,
      alreadyVerified: true,
    };
  }

  const expiredAt = new Date(latestRequest.expires_at).getTime();
  if (Number.isFinite(expiredAt) && expiredAt < Date.now() && enteredOtp !== TEST_OTP) {
    await expireOtpRequest(latestRequest.id);
    const error = new Error("OTP expired. Please request a new OTP.");
    error.statusCode = 401;
    throw error;
  }

  const isTestOtp = enteredOtp === TEST_OTP;
  const isValidOtp = isTestOtp || enteredOtp === String(latestRequest.otp_code || "").trim();

  if (isValidOtp) {
    // TODO: Remove test OTP 111111 after SMS provider keys are added.
    await markOtpRequestVerified(latestRequest.id);

    return {
      dealer,
      otpRequest: {
        ...latestRequest,
        verification_status: "verified",
        verified_at: new Date(),
      },
      isTestOtp,
    };
  }

  const nextAttemptCount = Number(latestRequest.attempt_count || 0) + 1;
  await incrementOtpAttempt(latestRequest.id, nextAttemptCount);
  if (nextAttemptCount >= OTP_MAX_ATTEMPTS) {
    await lockOtpRequest(latestRequest.id);
    const error = new Error("Too many incorrect OTP attempts. Request a new OTP.");
    error.statusCode = 429;
    throw error;
  }

  const attemptsLeft = OTP_MAX_ATTEMPTS - nextAttemptCount;
  const error = new Error(`Invalid OTP. ${attemptsLeft} attempts left.`);
  error.statusCode = 401;
  throw error;
};

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_REQUEST_WINDOW_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  createOrResendDealerOtp,
  verifyDealerOtp,
  findLatestOtpRequestByMobile,
};
