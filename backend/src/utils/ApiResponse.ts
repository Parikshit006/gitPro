import { Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';

export class ApiResponse<T> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly data?: T;

  private constructor(success: boolean, message: string, statusCode: number, data?: T) {
    this.success = success;
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.data = data;
  }

  static success<T>(res: Response, message: string, data?: T, statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json(new ApiResponse<T>(true, message, statusCode, data));
  }
}
