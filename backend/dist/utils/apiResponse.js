"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const constants_1 = require("../constants");
class ApiResponse {
    success;
    statusCode;
    message;
    data;
    constructor(statusCode = constants_1.HTTP_STATUS.OK, data, message) {
        this.success = statusCode >= 200 && statusCode < 400;
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
    static success(data, message, statusCode = constants_1.HTTP_STATUS.OK) {
        return new ApiResponse(statusCode, data, message);
    }
    static created(data, message) {
        return new ApiResponse(constants_1.HTTP_STATUS.CREATED, data, message);
    }
}
exports.ApiResponse = ApiResponse;
