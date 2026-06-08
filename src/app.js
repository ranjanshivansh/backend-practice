import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"15kb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());//use to configure cookies like CRUD operations

//routes
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users",userRouter) //after /users control goes to userRouter file

export {app};