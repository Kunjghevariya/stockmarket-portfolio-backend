export class ApiError extends Error {
  constructor(statusCode = 500, message = 'Something went wrong', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
