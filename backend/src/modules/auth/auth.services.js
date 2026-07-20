import {User} from "./auth.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import ApiError from "../../common/utils/apiError.js";
import { sendVerificationEmail } from "../../common/utils/sendEmail.js";
import { generateVerificationToken } from "../../common/utils/verifyToken.js";


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



export { signup};