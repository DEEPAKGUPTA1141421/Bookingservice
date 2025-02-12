import { Document, Types } from "mongoose";

export interface IBaseSchema extends Document {
  _id: Types.ObjectId; // This will correctly type the _id field as ObjectId
  createdAt: Date;
  updatedAt: Date;
}