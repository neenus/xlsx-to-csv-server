const path = require("path");
const crypto = require("crypto");

const buildUniqueUploadName = originalName => {
  const now = new Date();
  const pad = (n, len = 2) => n.toString().padStart(len, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
  const randomId = crypto.randomBytes(2).toString("hex");
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);

  return `${baseName}_${timestamp}_${randomId}${extension}`;
};

module.exports = {
  buildUniqueUploadName
};
