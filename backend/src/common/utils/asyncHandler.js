const asyncHandler = (fn) => (req, res, next) => {
    //we say that we are wrapping the function in a promise and if it fails then we are passing the error to the next middleware which is the error handler
    Promise.resolve(fn(req, res, next)).catch(next);
    //or 
    // Promise.resolve(fn(req, res, next)).catch((err) => next(err));
}