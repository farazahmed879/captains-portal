import { HTTP_STATUS } from '../constants';

export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message?: string;
  public readonly data?: T;

  constructor(statusCode: number = HTTP_STATUS.OK, data?: T, message?: string) {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }

  static success<T>(data?: T, message?: string, statusCode: number = HTTP_STATUS.OK): ApiResponse<T> {
    return new ApiResponse<T>(statusCode, data, message);
  }

  static created<T>(data?: T, message?: string): ApiResponse<T> {
    return new ApiResponse<T>(HTTP_STATUS.CREATED, data, message);
  }
}
