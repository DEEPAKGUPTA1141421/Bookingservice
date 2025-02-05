import { Request, Response } from "express";
import axios from "axios";
import { getAddressSchema } from "../validations/location_validations";

const API_KEY = process.env.API_KEY;

export const getAddressFromCoordinates = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = getAddressSchema.safeParse(req.body);
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
