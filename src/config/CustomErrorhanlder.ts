import ErrorHandler from './GlobalerrorHandler';  // Adjust the import path as necessary

const errorMiddleware = (err: any, req: any, res: any, next: any) => {
  // Default error message and status code
  err.message = err.message || 'Internal Server Error';
  err.statusCode = err.statusCode || 500;

  // Handle Mongoose CastError (Invalid ObjectId format)
  if (err.name === 'CastError') {
    const message = `Resource not found with this ID. Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle duplicate key error (Mongoose)
  if (err.code === 11000) {
    const message = `Duplicate key error: ${Object.keys(err.keyValue)} already exists.`;
    err = new ErrorHandler(message, 400);
  }

  // Handle invalid JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please try again later.';
    err = new ErrorHandler(message, 401);
  }

  // Handle expired JWT error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired. Please try again later.';
    err = new ErrorHandler(message, 401);
  }

  // Return a structured response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    statusCode: err.statusCode,
  });
};

export { errorMiddleware };
