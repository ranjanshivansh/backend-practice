import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
/*
import express from "express";
const app=express();

(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error",(error)=>{
        console.log("Application not able to talk to database",error);
        throw error;
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App is listening on ${process.env.PORT}`)
       })
    } catch (error) {
        console.error("ERROR",error);
        throw error;
    }
})()
    */
dotenv.config({
    path:'./.env'
})

//async await always return a promise using that
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log('Application not able to talk to database',error);
        throw error;
    })
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log('Something is wrong ',error);
})