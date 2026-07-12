export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    
    // Capturing stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}
