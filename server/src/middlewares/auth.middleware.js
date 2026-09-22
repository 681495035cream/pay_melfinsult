const User = require("../models/user.model");
const { verifyAccessToken } = require("../utils/token");

const requireAuth = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ message: "Your session is invalid or expired" });

  try {
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth };
