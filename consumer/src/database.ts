import dotenv from "dotenv";
import mongoose from "mongoose";
type env_type = String | any;
dotenv.config();
let isConnected = false;
export const connectDb = () => {
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }
  const connection_string: string = process.env.MONGODB_URL as string;
  const promiseReturByMongoose = mongoose.connect(connection_string);
  promiseReturByMongoose
      .then(() => {
        isConnected = true;
      console.log("connection Successful");
    })
      .catch((err: Error) => {
     isConnected = false;
      console.log(`connection unsuccesful ${err.message}`);
    });
};
