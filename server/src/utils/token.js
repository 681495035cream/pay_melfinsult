const crypto = require("crypto");

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

const base64url = (value) => Buffer.from(value).toString("base64url");

const sign = (value) =>
  crypto
    .createHmac("sha256", process.env.AUTH_TOKEN_SECRET || "change-this-development-secret")
    .update(value)
    .digest("base64url");

const createAccessToken = (userId) => {
  const payload = base64url(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
};

const verifyAccessToken = (token) => {
  const [payload, signature] = (token || "").split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Math.floor(Date.now() / 1000) && data.sub ? data : null;
  } catch {
    return null;
  }
};

module.exports = { createAccessToken, verifyAccessToken, TOKEN_TTL_SECONDS };
