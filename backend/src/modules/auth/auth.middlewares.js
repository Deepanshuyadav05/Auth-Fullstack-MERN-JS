import asyncHandler from "../../common/utils/asyncHandler.js";
import ApiError from "../../common/utils/apiError.js";
import { User } from "./auth.model.js";
import { verifyAccessToken, verifyRefreshToken } from "../../common/utils/generateTokenJWT.js";




//STRICT gatekeeper — for every route that must only work when logged in.
//Used on /logout-all now; later on /me, /change-password, etc.
//Wrapped in asyncHandler because Express 4 does not catch throws from async
//middleware on its own — without the wrapper a failure here hangs the request
//instead of reaching your errorMiddleware.
const authenticate = asyncHandler(async (req, res, next) => {
     let token;

    // Header format: "Bearer <TOKEN>" → split on space, take index 1.
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        throw ApiError.unauthorized("Not authenticated");
    }

     let decoded;
    try {
        // Verifies signature + expiry against ACCESS_TOKEN_SECRET.
        // A refresh token pasted here would be rejected — different secret.
        decoded = verifyAccessToken(token);
    } catch (error) {
        throw ApiError.unauthorized("Invalid or expired access token");
    }

    // We signed { userId } at login — so it's decoded.userId, NOT decoded.id.
    // The DB lookup also rejects tokens of deleted/banned users, which pure
    // JWT verification cannot: the signature stays valid after deletion.
    const user = await User.findById(decoded.userId);
    if (!user) {
        throw ApiError.unauthorized("User no longer exists");
    }

    req.user = user;
    req.userId = user._id;

    next();

});

//SOFT gatekeeper — used ONLY on /logout.
//Why it exists: the refresh cookie is httpOnly, so only a server response can
//clear it. If /logout used the strict middleware, an expired access token
//would 401 before clearCookie ever ran — the UI shows "logged out" while the
//session stays alive in the browser + DB for up to 7 days (phantom logout).
//Logout only REMOVES access, so proceeding on weak identity is safe here in a
//way it wouldn't be anywhere else.
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
     let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // Preferred path: a live access token.
    if (token) {
        try {
            const decoded = verifyAccessToken(token);
            req.userId = decoded.userId;
            return next();
        } catch (error) {
            // Expired/tampered — fall through to the refresh token instead
            // of rejecting. This is the whole point of this middleware.
        }
    }

    // Fallback: the refresh token carries the same { userId } payload and
    // lives 7 days, covering the "tab left open past 15 min" case. Still a
    // verified signature — not trusting raw input.
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken);
            req.userId = decoded.userId;
        } catch (error) {
            // Both tokens dead → no live session exists to revoke. Leave
            // req.userId undefined; the controller still clears the cookie,
            // which is the only useful work remaining.
        }
    }

    next();
})

export { authenticate, optionalAuthenticate };