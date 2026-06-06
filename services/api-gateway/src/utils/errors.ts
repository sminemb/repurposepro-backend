export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];

  public constructor(message: string, statusCode = 500, errors: unknown[] = []) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
