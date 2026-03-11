class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : "Server Error";

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = "A record with that value already exists";
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(", ");
  }

  res.status(statusCode).json({ success: false, error: message });
};

module.exports = { AppError, errorHandler };
