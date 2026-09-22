const crypto = require("crypto");
const User = require("../models/user.model");
const { createAccessToken, TOKEN_TTL_SECONDS } = require("../utils/token");

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const passwordMatches = (password, savedPassword) => {
  const [salt, storedHash] = (savedPassword || "").split(":");
  if (!salt || !storedHash) return false;
  const inputHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(storedHash, "hex"));
};

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, profile: user.profile || null });

const sendSession = (res, user, status = 200) =>
  res.status(status).json({
    user: publicUser(user),
    accessToken: createAccessToken(user._id.toString()),
    expiresIn: TOKEN_TTL_SECONDS,
  });

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: "This email is already registered" });
    }
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashPassword(password) });
    sendSession(res, user, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !passwordMatches(password, user.password)) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }
    sendSession(res, user);
  } catch (error) {
    next(error);
  }
};

const me = (req, res) => res.json({ user: publicUser(req.user) });

module.exports = { register, login, me };
