import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./common/middlewares/errorMiddleware.js";
import authRouter from "./modules/auth/auth.routes.js";

const app  = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, //so we can access cookie and other things
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], //for recieving bearer token
    
}));

app.use(morgan('dev'));

app.use('/api/auth', authRouter)

app.use(errorHandler); //global error handler

export default app;