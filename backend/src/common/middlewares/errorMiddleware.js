import ApiError from "../utils/apiError.js";

const errorHandler = (err, req, res, next) => {
    // Normalize: if it's not an ApiError, it's an unexpected bug → wrap as 500
    let error = err;
    if (!(error instanceof ApiError)) {
        error = ApiError.internalServerError(
            process.env.NODE_ENV === "development" ? err.message : "Internal Server Error"
        );
    }

    // Log real bugs (isOperational false or missing means unexpected)
    if (!err.isOperational) {
        console.error("UNEXPECTED ERROR:", err);
    }

    return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        // ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

export { errorHandler };