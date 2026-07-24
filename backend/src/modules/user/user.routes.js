import {Router} from "express";
import * as userController from "./user.controllers.js";
import { authenticate } from "../auth/auth.middlewares.js";

const userRouter = Router();

//getMe route
userRouter.get("/me", authenticate, userController.getMe);



export default userRouter;