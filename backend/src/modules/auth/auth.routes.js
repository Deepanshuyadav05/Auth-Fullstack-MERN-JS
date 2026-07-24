import {Router} from 'express';
import * as AuthController from './auth.controllers.js';
import validate from '../../common/middlewares/validateZod.js';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema} from './auth.validation.js';
import { authenticate, optionalAuthenticate } from './auth.middlewares.js';


const authRouter = Router();
console.log("router hit")


//signup route
authRouter.post('/signup', validate(signupSchema) ,AuthController.signup);

//email verification route
authRouter.post('/verify-email/:token', AuthController.emailVerification);

//resend verification email route
authRouter.post('/resend-verification-email', validate(forgotPasswordSchema), AuthController.resendVerificationEmail);

//login route
authRouter.post('/login', validate(loginSchema), AuthController.login);

//refresh route
authRouter.post('/refresh', AuthController.refresh);

//forgot password route
authRouter.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);

//reset password route
authRouter.post('/reset-password/:token', validate(resetPasswordSchema), AuthController.resetPassword);

//logout — SOFT auth: an expired access token must not be able to strand a
//live session (phantom logout). Identity falls back to the refresh cookie.
authRouter.post('/logout', optionalAuthenticate, AuthController.logout);

//logout-all — STRICT auth: destructive across all devices, so demand a
//fresh, fully-verified credential.
authRouter.post('/logout-all', authenticate, AuthController.logoutAll);

//getSessions route
authRouter.get("/sessions", authenticate, AuthController.getSessions)


export default authRouter;