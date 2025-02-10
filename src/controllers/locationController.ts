import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { getAddressSchema, getCoordinateSchema } from "../validations/location_validations";
import { getAddressFromCordinate, getDistanceTimeService } from "../services/locationservice";
import ErrorHandler from "../config/GlobalerrorHandler";
import { sendResponse } from "../utils/responseHandler";
import { CheckZodValidation } from "../utils/helper";

const API_KEY = process.env.API_KEY;

export const getAddressFromCoordinates = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = getCoordinateSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ error: validation.error.errors });
    return;
  }

  const { latitude, longitude } = req.body;

  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ error: "Invalid latitude or longitude" });
      return;
    }

    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}%2C${lon}&key=${API_KEY}`
    );

    console.log(response.data);

    if (response.data.status.code !== 200) {
      res.status(500).json({ error: "Unable to fetch address" });
      return;
    }

    const address = response.data.results[0].formatted;
    res.status(200).json({ address });
  } catch (error) {
    console.error("Error in getAddressFromCoordinates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAddressCordinate=async(req:Request,res:Response,next:NextFunction): Promise<void>=>{
  try{
    const validation=CheckZodValidation(req.query,getAddressSchema,next);
    const { address } = validation.data as { address: string };
    const response=await getAddressFromCordinate(address);
    sendResponse(res,201,"Coordinates Detail",response)
  }
  catch(error:any){
    next(new ErrorHandler(error.message,404) );
  }
}

export const getDistanceTime=async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const validation=CheckZodValidation(req.query,getDistanceTime,next);
    const {origin,destination}=validation.data as {origin: string , destination: string}
    const response=await getDistanceTimeService(origin,destination);
    sendResponse(res,201,"Distance",response);
  }
  catch(error:any){
    next(new ErrorHandler(error.message,404));
  }
}