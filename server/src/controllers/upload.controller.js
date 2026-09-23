const { put } = require("@vercel/blob");

const uploadFile = async (req, res, next) => {
  try {
    const fileName = req.headers["x-file-name"] || `upload-${Date.now()}`;
    const contentType = req.headers["content-type"] || "application/octet-stream";
    const body = req.body;

    if (!body || body.length === 0) {
      return res.status(400).json({ message: "No file content was provided." });
    }

    const blob = await put(fileName, body, {
      access: "public",
      contentType,
    });

    return res.status(201).json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile };
