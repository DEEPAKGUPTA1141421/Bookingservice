import axios from "axios"
import ErrorHandler from "../config/GlobalerrorHandler";
export const getAddressFromCordinate = async (address: string) => {
    const YOUR_API_KEY = process.env.GOOGLE_MAP_API;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${YOUR_API_KEY}`;
    try {
        const res = await axios.get(url);
        if (res.data.status == 'OK') {
            const response = res.data.results[0].geometry.location;
            console.log(response)
            return {
                lat: response.lat,
                lon: response.lng
            }
        }
        else {
            throw new ErrorHandler("NO Results for Current Address", 401)
        }
    }
    catch (error: any) {
        throw new ErrorHandler(error.message, 404);
    }
}

export const getDistanceTimeService = async (origin: string, destination: string) => {
    try {
        const YOUR_API_KEY = process.env.GOOGLE_MAP_API;
        const encodedOrigin = encodeURIComponent(origin);
        const encodedDestination = encodeURIComponent(destination);
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${encodedDestination}&origins=${encodedOrigin}&units=imperial&key=YOUR_API_KEY`;
        const res = await axios.get(url);
        if (res.data.status == 'OK') {
            const response = res.data.results[0].geometry.location;
            console.log(response)
            return {
                disatance:res.data.rows[0]?.elements[0]?.distance,
                duration:res.data.rows[0]?.elements[0]?.duration,
            }
        }
        else {
            throw new ErrorHandler("NO Results for Current Address", 401)
        }
    }
    catch (error:any) {
        throw new ErrorHandler(error.message, 404);
    }
}

export const getAutocompleteSuggestions = async (keyword: string) => {  
    try {
        const YOUR_API_KEY = process.env.GOOGLE_MAP_API;
        const encodedKeyword = encodeURIComponent(keyword);
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedKeyword}&key=${YOUR_API_KEY}`;
        const res = await axios.get(url);
        if (res.data.status == 'OK') {
            return res.data.predictions;
        }
        else {
            throw new ErrorHandler("NO Results for Current Address", 401)
        }
    }
    catch (error: any) {
        throw new ErrorHandler(error.message, 404);
    }
}