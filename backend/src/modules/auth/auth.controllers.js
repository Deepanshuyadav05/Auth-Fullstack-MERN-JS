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

// clearCookie only works with the SAME options the cookie was set with
// (minus maxAge) — otherwise the browser keeps the original.
const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Strict"
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

//resend verification email controller
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.resendEmailVerificationService(email);
    ApiResponse.ok(res, "Verification email resent successfully");
})

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

//forgot password controller
const forgotPassword = asyncHandler(async (req, res) => {
    await authService.forgotPasswordService(req.body.email);
    ApiResponse.ok(res, "If an account with that email exists, a password reset link has been sent.");
})

//reset password controller
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    await authService.resetPasswordService({ token, newPassword, confirmPassword });
    ApiResponse.ok(res, "Password reset successfully");
})


//logout controller — this device only
const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    // req.userId was set by optionalAuthenticate — may be undefined if every
    // token was dead; the service treats that as "nothing to revoke".
    await authService.logoutService(req.userId, refreshToken);

    // The mandatory half: the client cannot delete an httpOnly cookie itself.
    res.clearCookie("refreshToken", clearCookieOptions);

    ApiResponse.ok(res, "Logged out successfully");
})

//logout-all controller — every device
const logoutAll = asyncHandler(async (req, res) => {
    // req.userId guaranteed — strict authenticate runs before this.
    await authService.logoutAllService(req.userId);

    res.clearCookie("refreshToken", clearCookieOptions);

    ApiResponse.ok(res, "Logged out from all devices successfully");
})


export { signup, emailVerification, resendVerificationEmail, login, refresh, forgotPassword, resetPassword, logout, logoutAll };