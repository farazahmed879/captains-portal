"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const constants_1 = require("../constants");
class ApiError extends Error {
    statusCode;
    isOperational;
    errors;
    constructor(statusCode = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'An unexpected server error occurred', errors = [], isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message, errors = []) {
        return new ApiError(constants_1.HTTP_STATUS.BAD_REQUEST, message, errors);
    }
    static unauthorized(message = 'Unauthorized access') {
        return new ApiError(constants_1.HTTP_STATUS.UNAUTHORIZED, message);
    }
    static forbidden(message = 'Forbidden access') {
        return new ApiError(constants_1.HTTP_STATUS.FORBIDDEN, message);
    }
    static notFound(message = 'Resource not found') {
        return new ApiError(constants_1.HTTP_STATUS.NOT_FOUND, message);
    }
    static conflict(message) {
        return new ApiError(constants_1.HTTP_STATUS.CONFLICT, message);
    }
    static internal(message = 'Internal server error') {
        return new ApiError(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
    }
}
exports.ApiError = ApiError;
