import axios from "axios";
import ErrorHandler from "../config/GlobalerrorHandler";
import { getTypeAutoComplete } from "../utils/GlobalTypescript";
export const getAddressFromCordinate = async (address: string) => {
  const YOUR_API_KEY = process.env.GOOGLE_MAP_API;
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${YOUR_API_KEY}`;
  try {
    const res = await axios.get(url);
    if (res.data.status == "OK") {
      const response = res.data.results[0].geometry.location;
      console.log(response);
      return {
        lat: response.lat,
        lon: response.lng,
      };
    } else {
      throw new ErrorHandler("NO Results for Current Address", 401);
    }
  } catch (error: any) {
    throw new ErrorHandler(error.message, 404);
  }
};

export const getAddressFromLatLng = async (
  lat: number,
  lng: number
): Promise<string> => {
  const API_KEY = process.env.GOOGLE_MAP_API; // ✅ Ensure API key is set in .env
  if (!API_KEY) throw new Error("Missing Google Maps API Key");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

  try {
    const res = await axios.get(url);
    if (res.data.status === "OK" && res.data.results.length > 0) {
      return res.data.results[0].formatted_address; // ✅ Extracts full formatted address
    } else {
      throw new Error("No address found for the given coordinates");
    }
  } catch (error: any) {
    throw new Error(`Google Maps API Error: ${error.message}`);
  }
};

export const getDistanceTimeService = async (
  origin: string,
  destination: string
) => {
  try {
    const YOUR_API_KEY = process.env.GOOGLE_MAP_API;
    const encodedOrigin = encodeURIComponent(origin);
    const encodedDestination = encodeURIComponent(destination);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${encodedDestination}&origins=${encodedOrigin}&units=imperial&key=YOUR_API_KEY`;
    const res = await axios.get(url);
    if (res.data.status == "OK") {
      const response = res.data.results[0].geometry.location;
      console.log(response);
      return {
        disatance: res.data.rows[0]?.elements[0]?.distance,
        duration: res.data.rows[0]?.elements[0]?.duration,
      };
    } else {
      throw new ErrorHandler("NO Results for Current Address", 401);
    }
  } catch (error: any) {
    throw new ErrorHandler(error.message, 404);
  }
};

export const getAutocompleteSuggestions = async (obj: getTypeAutoComplete) => {
  try {
    const YOUR_API_KEY = process.env.GOOGLE_MAP_API;
    const { cityLat, cityLng, radius, keyword } = obj;
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedKeyword}&key=${YOUR_API_KEY}&components=country:IN&location=${cityLat},${cityLng}&radius=${radius}`;
    const res = await axios.get(url);
    if (res.data.status == "OK") {
      return res.data.predictions;
    } else {
      throw new ErrorHandler("NO Results for Current Address", 401);
    }
  } catch (error: any) {
    throw new ErrorHandler(error.message, 404);
  }
};
