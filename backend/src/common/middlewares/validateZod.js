const validate = (schema) => (req, res, next) => {
    //validate request body with zod schema
    const result = schema.safeParse(req.body);
      if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    // → { email: ["Invalid email address"], password: ["Password must be at least 8 characters"] }
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    }
    req.body = result.data; //use the cleaned/transformed data
  next();
};

export default validate;

//if the data is valid then result look like
// {
//   "success": true,
//   "data": "your_validated_and_parsed_data"
// }

//if the data is invalid then result look like
// {
//   "success": false,
//   "error": {
//     "issues": [
//       {
//         "code": "invalid_type",
//         "expected": "string",
//         "received": "number",
//         "path": ["username"],
//         "message": "Expected string, received number"
//       }
//     ],
//     "_errors": []
//   }
// }