import dotenv from "dotenv";
import  mongoose from "mongoose";
type env_type=String | any
dotenv.config()
const connectDb=()=>{
  const connection_string: string = process.env.MONGODB_URL as string;
  const promiseReturByMongoose=mongoose.connect(connection_string);
  promiseReturByMongoose.then(()=>{
      console.log("connection Successful");
  }).catch((err:Error)=>{
      console.log(`connection unsuccesful ${err.message}`);
  })
}
module.exports=connectDb;
