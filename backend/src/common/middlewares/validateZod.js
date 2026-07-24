import ApiError from "../utils/apiError.js";

const validate = (schema) => (req, res, next) => {
    //validate request body with zod schema
    const result = schema.safeParse(req.body);

    if (!result.success) {
        // Don't respond from here — that creates a second exit door with its
        // own format. Build a normal ApiError so the errorHandler stays the
        // single place that shapes error responses...
        const error = ApiError.badRequest("Validation failed");
        // ...but keep the per-field details by attaching them to the error.
        // { email: ["Invalid email address"], password: ["Too short"] }
        error.errors = result.error.flatten().fieldErrors;  //adding a error field in ApiError object
        throw error;
    }

    req.body = result.data; //use the cleaned/transformed data
  next();
};

export default validate;

//if the data is VALID, safeParse returns:
// {
//   success: true,
//   data: { ...cleaned & transformed body — trimmed, lowercased by the schema }
// }

//if the data is INVALID, safeParse returns (this is what `result` looks like):
// {
//   success: false,
//   error: ZodError {
//     issues: [
//       { code: "invalid_type", expected: "string", received: "number",
//         path: ["username"], message: "Expected string, received number" },
//     ]
//   }
// }

//result.error.flatten().fieldErrors squashes those issues into:
// { email: ["Invalid email address"], password: ["Password must be at least 8 characters"] }

//...which we attach to the ApiError WE build (this is what we THROW, not what Zod returns):
// ApiError {
//   message: "Validation failed",
//   statusCode: 400,
//   isOperational: true,
//   errors: { email: ["Invalid email address"], ... },   // ← the flattened fieldErrors
//   stack: "..."
// }
