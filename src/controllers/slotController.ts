import { Request, Response } from "express";
import { ServiceProviderAvailability } from "../models/ServiceProviderAvailabilitySchema";
import { BookedSlot } from "../models/BookedSlotSchema";

// Utility function to safely parse date
const parseDate = (date: unknown): Date | null => {
  if (typeof date === "string" && !isNaN(Date.parse(date))) {
    return new Date(date);
  }
  return null;
};

// **Get Available Slots**
export const getAvailableSlots = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { providerId, date } = req.query;

    if (!providerId || !date) {
      res.status(400).json({ message: "Provider ID and Date are required" });
      return;
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    // Fetch provider's availability
    const availability = await ServiceProviderAvailability.findOne({
      provider: providerId,
      date: parsedDate,
      is_active: true,
    });

    if (!availability) {
      res
        .status(404)
        .json({ message: "No available slots for this provider on this date" });
      return;
    }

    // Fetch booked slots
    const bookedSlots = await BookedSlot.find({
      provider: providerId,
      date: parsedDate,
    });

    const bookedTimeRanges = bookedSlots.map((slot) => ({
      start: slot.start_time,
      end: slot.end_time,
    }));

    // Generate available slots
    const availableSlots = generateAvailableSlots(
      availability.start_time,
      availability.end_time,
      bookedTimeRanges
    );

    res.json({ availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// **Book a Slot**
export const bookSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerId, serviceId, date, startTime, endTime } = req.body;

    if (!providerId || !serviceId || !date || !startTime || !endTime) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    // Check if provider is available
    const providerAvailability = await ServiceProviderAvailability.findOne({
      provider: providerId,
      date: parsedDate,
      is_active: true,
    });

    if (!providerAvailability) {
      res.status(400).json({ message: "Provider not available on this date" });
      return;
    }

    // Check for slot clashes
    const existingBooking = await BookedSlot.findOne({
      provider: providerId,
      date: parsedDate,
      $or: [{ start_time: { $lt: endTime }, end_time: { $gt: startTime } }],
    });

    if (existingBooking) {
      res.status(400).json({ message: "This slot is already booked" });
      return;
    }

    // Save booked slot (No full booking creation)
    const bookedSlot = new BookedSlot({
      provider: providerId,
      service: serviceId,
      date: parsedDate,
      start_time: startTime,
      end_time: endTime,
    });

    await bookedSlot.save();

    res.status(201).json({ message: "Slot booked successfully", bookedSlot });
  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// **Get Booked Slots**
export const getBookedSlots = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { providerId, date } = req.query;

    if (!providerId || !date) {
      res.status(400).json({ error: "Provider ID and Date are required" });
      return;
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Fetch booked slots
    const bookedSlots = await BookedSlot.find({
      provider: providerId,
      date: parsedDate,
    }).select("start_time end_time");

    res.json({ bookedSlots });
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// **Helper Functions**
const generateAvailableSlots = (
  start: string,
  end: string,
  booked: { start: string; end: string }[]
) => {
  const slots: string[] = [];
  let current = start;

  while (current < end) {
    const nextSlot = addMinutes(current, 30);
    if (!booked.some((slot) => isOverlapping(current, nextSlot, slot))) {
      slots.push(current);
    }
    current = nextSlot;
  }

  return slots;
};

const isOverlapping = (
  start: string,
  end: string,
  bookedSlot: { start: string; end: string }
) => {
  return start < bookedSlot.end && end > bookedSlot.start;
};

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toTimeString().substring(0, 5);
};
