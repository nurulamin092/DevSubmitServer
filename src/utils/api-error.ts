export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = "ERROR",
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(msg = "Bad request", details?: unknown) {
    return new ApiError(400, msg, "BAD_REQUEST", details);
  }
  static unauthorized(msg = "Unauthorized") {
    return new ApiError(401, msg, "UNAUTHORIZED");
  }
  static forbidden(msg = "Forbidden") {
    return new ApiError(403, msg, "FORBIDDEN");
  }
  static notFound(msg = "Not found") {
    return new ApiError(404, msg, "NOT_FOUND");
  }
  static conflict(msg = "Conflict") {
    return new ApiError(409, msg, "CONFLICT");
  }
  static tooMany(msg = "Too many requests") {
    return new ApiError(429, msg, "TOO_MANY_REQUESTS");
  }
  static internal(msg = "Internal server error") {
    return new ApiError(500, msg, "INTERNAL");
  }
}
