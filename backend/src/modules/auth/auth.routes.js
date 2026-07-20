import {Router} from 'express';
import * as AuthController from './auth.controllers.js';
import validate from '../../common/middlewares/validateZod.js';
import { signupSchema } from './auth.validation.js';


const authRouter = Router();
console.log("router hit")


//signup route
authRouter.post('/signup', validate(signupSchema) ,AuthController.signup);



export default authRouter;