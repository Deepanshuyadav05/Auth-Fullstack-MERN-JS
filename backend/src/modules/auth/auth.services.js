import {User} from "./auth.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import ApiError from "../../common/utils/apiError.js";
import { sendVerificationEmail } from "../../common/utils/sendEmail.js";
import { generateVerificationToken } from "../../common/utils/verifyToken.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../common/utils/generateTokenJWT.js";


//signup service
const signup = async ({name, email, password}) => {
    console.log("Signup service called with:", { name, email, password });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw ApiError.badRequest("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const {rawToken, hashedToken} = generateVerificationToken();

    console.log(" tokens:",rawToken);  //to test email verification link in postman

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        verificationTokenHash: hashedToken,
        verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, //24hr
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;

    try{
        //send verification email to user with the verification link
        await sendVerificationEmail(email, verificationLink);
    }
    catch(error){
        //if email is failed to send then rollback means delete the user from DB
        await User.findByIdAndDelete(user._id); // delete the user if email sending fails
        throw ApiError.internalServerError("Registration failed because the verification email could not be sent. Please try again.");
    }

    //normalize the object and send a response
    const userData = user.toObject();
    delete userData.password;
    delete userData.verificationTokenHash;
    delete userData.verificationTokenExpiresAt;

    return userData;
}

//email verification service
const verifyEmail = async (token) => {
    if(!token) {
        throw ApiError.badRequest("Verification token is required");
    }
    console.log("token: ", token)

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        verificationTokenHash: hashedToken,
        verificationTokenExpiresAt: { $gt: Date.now() } // Check if the token is not expired
    }).select("+verificationTokenHash +verificationTokenExpiresAt"); // Include the fields in the query result

    if(!user) {
        throw ApiError.badRequest("Invalid or expired verification token");
    }

    //check does a user already verifyed
    if(user.isEmailVerified){
        throw ApiError.conflict("Email already verified")
    }

    user.isEmailVerified = true;
    //In Mongoose, setting a field to null explicitly stores a null value in the database. Setting it to undefined completely removes the field from that specific document
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    //send response
    return { message: "Email verified successfully" };
}

//login service
const login = async ({email, password}) => {
    const user = await User.findOne({ email }).select("+password +refreshTokenHash"); // Include the password and refreshTokenHash fields in the query result

    if(!user) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    if(!user.isEmailVerified) {
        throw ApiError.unauthorized("Email not verified. Please verify your email before logging in.");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    //Generate Access and Refresh JWT token
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    user.refreshTokenHash.push({ 
        tokenHash: hashedRefreshToken, 
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    }); 
    
    await user.save();

    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshTokenHash;
    delete userData.refreshTokenExpiresAt;

    return {userData, accessToken, refreshToken};
}

//refresh token service
const refreshTokenService = async (refreshToken) => {
    if(!refreshToken) {
        throw ApiError.badRequest("Refresh token is required");
    }

    let payload;
  try {
        // verify the token that if the token is created using our SECRET or not
        payload = verifyRefreshToken(refreshToken)
    } catch (error) {
        throw ApiError.unauthorized("Invalid or expired refresh token")
    }

    //find a user using the id we passed in the payload of token
    //we got id as we have sended it when we have created the token in login service as a payload
    const user = await User.findById(payload.userId).select("+refreshTokenHash")
    if(!user){
        throw ApiError.unauthorized("User not found")
    }

    //hash the incoming refresh token and match it with the hashed refreshToken stored in DB
    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    //verify if the hashed refresh token exists in the user's refreshTokenHash array
    //find method : returns the first element in the provided array that satisfies the provided testing function.
    const match = user.refreshTokenHash.find(tokenObj => tokenObj.tokenHash === hashedRefreshToken);
     // Reuse detection: valid signature, but hash isn't stored → already rotated out → replay
     //major security issue, so delete all refresh tokens for that user and force re-login
     // If the match is not found, it indicates that the refresh token has been reused or is invalid
  if (!match) {
    user.refreshTokenHash = [];        // nuke the family, force full re-login
    await user.save();
    throw ApiError.forbidden("Refresh token reuse detected");
  }

  // Rotate: remove used token, add new one, prune anything expired while we're here
  const now = new Date();
  //filter keeps every element for which the condition is true, and drops the rest. So an entry survives only if both are true:
//   user.refreshTokenHash = user.refreshTokenHash.filter(
//     //    remove the token that we used right now
//     //    also remove the expired tokens, so that we don't have a huge list of tokens in the DB
//     e => e.tokenHash !== hashedRefreshToken && e.expiresAt > now
//   );
  //or in simpler way
  user.refreshTokenHash = user.refreshTokenHash
  .filter(e => e.tokenHash !== hashedRefreshToken)  // consume used token (required)
  .filter(e => e.expiresAt > now);            // prune expired (housekeeping)

  //Generate Access and Refresh JWT token
    const newAccessToken = generateAccessToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)

    const newHashedRefreshToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    await user.refreshTokenHash.push({ 
        tokenHash: newHashedRefreshToken, 
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    await user.save();

    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshTokenHash;

    return {userData, newAccessToken, newRefreshToken};


}

export { signup, verifyEmail, login, refreshTokenService };