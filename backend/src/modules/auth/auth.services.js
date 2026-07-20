import {User} from "./auth.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import ApiError from "../../common/utils/apiError.js";
import { sendVerificationEmail } from "../../common/utils/sendEmail.js";
import { generateVerificationToken } from "../../common/utils/verifyToken.js";
import { generateAccessToken, generateRefreshToken } from "../../common/utils/generateTokenJWT.js";


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

export { signup, verifyEmail, login };