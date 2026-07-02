import "./env.js";
import express from "express";
import connectDB from "./db/index.js";
import {app} from "./app.js";


// const app  = express();
connectDB()
.then(()=>{
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running on PORT ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGODB COnnection Failed !!!", error);
})

/*
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("Error: ", error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is Listening on Port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Error: ", error);

    }
})()
*/