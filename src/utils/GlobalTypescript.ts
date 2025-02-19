import { numBytes } from "aws-sdk/clients/finspace";
import { Document, Types } from "mongoose";
import { number } from "zod";

export interface IBaseSchema extends Document {
  _id: Types.ObjectId; // This will correctly type the _id field as ObjectId
  createdAt: Date;
  updatedAt: Date;
}

export interface create_status_return {
  status: string;
}

export interface getAvailiblityObj {
  actualserviceid: Types.ObjectId;
  latitude: number;
  longitude: number;
  range: number;
  minute:number
}

export interface GetBookSlotType {
  providerIds: string[];
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotTiming: number;
  cartId: Types.ObjectId;
  userId: Types.ObjectId;
  address: {
    street?: string; // Optional because street is marked as optional in the schema
    city: string;
    state: string;
    country: string;
    location: {
      type: "Point"; // Literal type, always "Point"
      coordinates: [number, number]; // Coordinates as [longitude, latitude]
    };
  };
}

export interface initiatedPaymentType {
  userId: Types.ObjectId;
  booking: Types.ObjectId;
  amount: number;
}

export interface getTypeAutoComplete {
  keyword: string;
  cityLat: number;
  cityLng: number;
  radius: number;
}

export interface OtpVerficationType {
  bookingId: Types.ObjectId
  userid: Types.ObjectId;
  providerLat: number;
  providerLon: number;
}