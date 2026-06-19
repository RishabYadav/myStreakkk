export class HttpError extends Error {
  statusCode: number;
  isOperational = true;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}
