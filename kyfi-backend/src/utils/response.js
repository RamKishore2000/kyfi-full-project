function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

module.exports = { sendJson };
