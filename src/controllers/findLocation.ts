import express, { Request, Response } from "express";
import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { z } from "zod";
import ServiceProvider from "../models/ServiceProviderSchema ";
import { ServiceProviderAvailability } from "../models/ServiceProviderAvailabilitySchema";

dotenv.config();
const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const searchQuerySchema = z.object({
  latitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Latitude must be a valid number",
  }),
  longitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Longitude must be a valid number",
  }),
  radius: z
    .string()
    .optional()
    .default("2")
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Radius must be a number",
    }),
  date: z.string().optional(),
  serviceId: z.string().optional(),
});

export const findProviders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedQuery = searchQuerySchema.safeParse(req.query);

    if (!validatedQuery.success) {
      res.status(400).json({ errors: validatedQuery.error.errors });
      return;
    }

    const { latitude, longitude, radius, date, serviceId } =
      validatedQuery.data;
    const radiusInMeters = parseInt(radius) * 1000;

    const googlePlacesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusInMeters}&type=service&key=${GOOGLE_API_KEY}`;

    const googleResponse = await axios.get(googlePlacesUrl);
    const places = googleResponse.data.results;

    if (!places || places.length === 0) {
      res
        .status(404)
        .json({ message: "No providers found in the given radius." });
      return;
    }

    const providers = await ServiceProvider.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      },
      ...(serviceId && {
        actualService: { $in: new mongoose.Types.ObjectId(serviceId) },
      }),
    });

    if (date) {
      const availableProviders = await ServiceProviderAvailability.find({
        provider: { $in: providers.map((p) => p._id) },
        date: new Date(date),
        is_active: true,
      }).populate("provider");

      res.status(200).json({ providers: availableProviders });
      return;
    }

    const sortedProviders = providers.sort((a, b) => b.rating - a.rating);

    res.status(200).json({ providers: sortedProviders });
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
