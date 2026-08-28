export interface ErrorSource {
  path: string;
  message: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errorSources?: ErrorSource[];

  constructor(status: number, message: string, errorSources?: ErrorSource[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorSources = errorSources;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}
