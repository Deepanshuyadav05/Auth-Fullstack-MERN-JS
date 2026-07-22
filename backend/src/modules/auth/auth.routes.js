import {Router} from 'express';
import * as AuthController from './auth.controllers.js';
import validate from '../../common/middlewares/validateZod.js';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema} from './auth.validation.js';


const authRouter = Router();
console.log("router hit")


//signup route
authRouter.post('/signup', validate(signupSchema) ,AuthController.signup);
//email verification route
authRouter.post('/verify-email/:token', AuthController.emailVerification);
//login route
authRouter.post('/login', validate(loginSchema), AuthController.login);
//refresh route
authRouter.post('/refresh', AuthController.refresh);
//forgot password route
authRouter.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
//reset password route
authRouter.post('/reset-password/:token', validate(resetPasswordSchema), AuthController.resetPassword);

export default authRouter;