import asyncHandler from "../../common/utils/asyncHandler.js";
import ApiResponse from "../../common/utils/apiResponse.js";
import * as authService from "./auth.services.js";

//signup controller
const signup = asyncHandler(async (req, res) => {
    console.log("Signup request body:", req.body);
    

    const userData = await authService.signup(req.body);

    ApiResponse.created(res, "User registered successfully. Please check your email to verify your account.", userData);
});



export { signup };