import { ServiceProviderAvailability } from "../models/ServiceProviderAvailabilitySchema";
import { BookedSlot } from "../models/BookedSlotSchema";
import { generateAvailableSlots, generateUpcomingTimeSlots, getAvailableProvidersFromRedis } from "../utils/helper";
import ErrorHandler from "../config/GlobalerrorHandler";
import { getAvailiblityObj, GetBookSlotType } from "../utils/GlobalTypescript";
import mongoose,{Types} from "mongoose";
import { Booking } from "../models/BookingSchema";

export const getAvailableSlots = async (obj:getAvailiblityObj):Promise<Record<string, string[]>> => {
    try {
      const { actualserviceid, latitude, longitude, range,minute } = obj;
      console.log("checking slots", actualserviceid, latitude, longitude, range);
      let providers=[];
      // const providers = await getAvailableProvidersFromRedis(actualserviceid, latitude, longitude, range);
      // currently redis is not working for me so i add temp providers for test purpose
      providers.push(
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
        "67b1dd7d74cac7b6b9d84083",
      );
      const providerSlots: Record<string, string[]> = {};
      const now = new Date();
      console.log("current time",now);
      const minutes = now.getMinutes();
      console.log("current minute", minutes);
      const remainder = minutes % 30;
      console.log("remainder", remainder);
      if (remainder !== 0) {
        now.setMinutes(minutes + (30 - remainder)); 
      }
    const endTime = new Date(now);
      endTime.setHours(20, 0, 0, 0);
      console.log("endtime",endTime);
      while (now < endTime) {
      for (const provider of providers) {
        let numberofSlot = minute / 30;
        let currslot = formatTime(now);
        let timeIndex = getIndex(currslot);
        let available_bit = 16777215;
        if (checkConsecutive(available_bit, timeIndex, numberofSlot)) {
          console.log("check condition");
          if (!providerSlots[currslot]) providerSlots[currslot] = [];
          providerSlots[currslot].push(provider);
        }
      }
      now.setMinutes(now.getMinutes() + 30);
      }
      console.log("get all data",providerSlots);
      return providerSlots;
    }
    catch (error:any) {
      throw new ErrorHandler(error.message, 501);
    }
};

export const bookSlot = async (obj: GetBookSlotType) => {
  console.log("we hit the service level");
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log("start transcation");
  try {
    const providerAvailability =
      await ServiceProviderAvailability.findOneAndUpdate(
        {
          provider: new mongoose.Types.ObjectId(obj.providerId),
          date: obj.date,
          is_active: true,
        },
        {},
        { session, new: true }
      );
    if (!providerAvailability) {
      console.log("fail to find");
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    // Check if slot is already booked

    console.log("befire book Slot");
    console.log("Happy Ending the Flow after everything");
    const startTimeInMinutes = timeToMinutes(obj.startTime);
    const endTimeInMinutes = timeToMinutes(obj.endTime);

    // book slot is not working correctly for now 
    const existingBooking = await BookedSlot.findOne(
      {
        provider: new mongoose.Types.ObjectId(obj.providerId),
        date: obj.date,
        start_time: { $gte: startTimeInMinutes }, // start time must be greater than or equal to requested start time
        end_time: { $lte: endTimeInMinutes }, // end time must be less than or equal to requested end time
      },
      null,
      { session }
    );
    console.log("Happy Ending the Flow after everything");
    if (existingBooking) {
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    // Update available_bit (Revert the bit)
    const slotIndex = getIndex(obj.startTime); // Get bit index
    const slotDuration = obj.slotTiming / 30; // Number of slots to update
    let availableBit = providerAvailability.available_bit;

    console.log("slotIndex", slotIndex, slotDuration,availableBit);


    for (let i = slotIndex; i < slotIndex + slotDuration; i++) {
      console.log(i);
      if (((availableBit >> i) & 1) === 0) {
        // Slot already booked, rollback
        await session.abortTransaction();
        session.endSession();
        return null;
      }
      availableBit &= ~(1 << i); // Set bit to 0 (mark as booked)
    }
    console.log("after change available bit", availableBit);
    providerAvailability.available_bit = availableBit;
    await providerAvailability.save({ session });

    // Book the slot
    const bookedSlot = new BookedSlot({
      provider: obj.providerId,
      service: obj.serviceId,
      date: obj.date,
      start_time: convertTimeToDate(obj.startTime),
      end_time: convertTimeToDate(obj.endTime),
      slotTiming:obj.slotTiming
    });
    const booking = new Booking({
      user: obj.userId, // Assuming you have a userId in the obj
      cart: obj.cartId, // Assuming you have a cartId in the obj
      bookingSlot_id:bookedSlot.id,
      bookingDate: new Date(),
      scheduledTime: true, // You can set this dynamically based on your requirements
      address: {
        street: obj.address.street,
        city: obj.address.city,
        state: obj.address.state,
        country: obj.address.country,
        location: {
          type: "Point",
          coordinates: [
            obj.address.location.coordinates[0],
            obj.address.location.coordinates[1],
          ], // Assuming you have latitude and longitude in the obj
        },
      },
    });
    await booking.save({ session });
    await bookedSlot.save({ session });   
    await session.commitTransaction();
    session.endSession();
    return bookedSlot;
  } catch (error:any) {
    await session.abortTransaction();
    session.endSession();
    throw new ErrorHandler(error.message,501);
  }
};

const formatTime = (date: Date): string => {
  let hours = date.getHours();
  let minutes = date.getMinutes();

  if (minutes < 15) {
    minutes = 30;
  } else {
    minutes = 0;
    hours++; // Move to the next hour
  }

  return `${hours}:${minutes === 0 ? "00" : "30"}`;
};


const getIndex = (startTime: string): number => {
  let currhour:string = startTime.split(":")[0];
  let currminute:string = startTime.split(":")[1];
  let hour = 8, minute = 0, index = 0;
  let diff:number = Number(currhour) - hour;
  diff = diff * 2;
  return diff + (currminute == "30" ? 1 : 0);
};

const checkConsecutive = (
  available_bit: number,
  timeIndex: number,
  numberOfSlots: number
): boolean => {
  if (timeIndex < 0) return false; 

  for (let i = timeIndex; i < timeIndex + numberOfSlots; i++) {
    if (((available_bit >> i) & 1) === 0) return false;
  }
  return true;
};

function timeToMinutes(time:string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function convertTimeToDate(time:string) {
  const today = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  today.setHours(hours, minutes, 0, 0); // Set the time on today's date
  return today;
}