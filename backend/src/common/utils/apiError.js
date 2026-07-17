class ApiError extends Error {

    constructor(statusCode, message) {
        super(message);  //This is required when extending a class in JavaScript. It passes the message string up to the base Error class so native methods can read it.
        this.statusCode = statusCode; //The HTTP status (e.g., 401 for Unauthorized, 400 for Bad Request).
        this.isOperational = true; //It allows your global error handler to differentiate btw trusted, expected errors (like a user typing the wrong password) and untrusted, unexpected bugs (like your database crashing).
        Error.captureStackTrace(this, this.constructor); //This maps the error back to the exact line of code in your project where it was thrown, rather than where the class was defined.
    }

    static notFound(message = "Not Found") {
        return new ApiError(404, message);
    }

    static badRequest(message = "Bad Request") {
        return new ApiError(400, message);
    }

    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }

    static internalServerError(message = "Internal Server Error") {
        return new ApiError(500, message);
    }

    static conflict(message = "Conflict") {
        return new ApiError(409, message);
    }

    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }


}

export default ApiError;