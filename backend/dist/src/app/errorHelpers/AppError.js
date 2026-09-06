class AppError extends Error {
    statusCode;
    constructor(statusCode, message, stack = "") {
        super(message); // Error("My Error Message")
        this.statusCode = statusCode;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export default AppError;
