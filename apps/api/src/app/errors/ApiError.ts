class ApiError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(
    statusCode: number,
    message: string | undefined,
    stack = "",
    errorCode?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
