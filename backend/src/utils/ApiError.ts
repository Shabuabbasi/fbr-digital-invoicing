export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, code = "VALIDATION_ERROR") {
    return new ApiError(400, code, message);
  }
  static badGateway(message: string, code = "BAD_GATEWAY") {
    return new ApiError(502, code, message);
  }
  static gatewayTimeout(message: string, code = "GATEWAY_TIMEOUT") {
    return new ApiError(504, code, message);
  }
  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new ApiError(401, code, message);
  }
  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new ApiError(403, code, message);
  }
  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new ApiError(404, code, message);
  }
  static conflict(message: string, code = "CONFLICT") {
    return new ApiError(409, code, message);
  }
  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new ApiError(500, code, message);
  }
}
