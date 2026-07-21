import asyncHandler from "../../common/utils/asyncHandler.js";
import ApiResponse from "../../common/utils/apiResponse.js";
import ApiError from "../../common/utils/apiError.js";
import * as authService from "./auth.services.js";


//shared cookie options for the refreshToken cookie, used by both login and refresh
const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}


//signup controller
const signup = asyncHandler(async (req, res) => {
    console.log("Signup request body:", req.body);
    

    const userData = await authService.signup(req.body);

    ApiResponse.created(res,"User registered successfully. Please check your email to verify your account.", userData);
});

//email verification controller
const emailVerification = asyncHandler(async (req, res) => {
    const { token } = req.params;

    await authService.verifyEmail(token);
    ApiResponse.ok(res, "Email verified successfully");
});

//login controller
const login = asyncHandler(async (req, res) => {
    const { userData, accessToken, refreshToken } = await authService.login(req.body);

    //           labelName     valueToStore      cookieOptions
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    ApiResponse.ok(res,"Login successful", { userData, accessToken });
});

//refresh controller
const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        throw ApiError.unauthorized("Refresh token not found");
    }

    const { userData, newAccessToken, newRefreshToken } = await authService.refreshTokenService(refreshToken);

    // Update the refresh token cookie
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    ApiResponse.ok(res, "Token refreshed successfully", { userData, accessToken: newAccessToken });

})

export { signup, emailVerification, login, refresh };