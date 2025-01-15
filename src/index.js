import { app } from "./app.js";
import DBConnect from "./db/index.js";
import dotenv from "dotenv"


dotenv.config({
    path:"./env"
})

DBConnect()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`app listening on port http://localhost:${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!! ", err);
})