import { ServiceProviderAvailability } from "../models/ServiceProviderAvailabilitySchema";
import { BookedSlot } from "../models/BookedSlotSchema";
import { convertStringToObjectId, generateAvailableSlots, generateUpcomingTimeSlots, getAvailableProvidersFromRedis } from "../utils/helper";
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
        // if (checkConsecutive(available_bit, timeIndex, numberofSlot)) {
        //   console.log("check condition");
        //   if (!providerSlots[currslot]) providerSlots[currslot] = [];
        //   providerSlots[currslot].push(provider);
        // }
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

  try {
    // Fetch only required fields using `.lean()`
    console.log(obj.providerIds);
    const providerAvailabilities = await ServiceProviderAvailability.find(
      {
        provider: {
          $in: obj.providerIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        is_active: true,
      },
      { provider: 1, available_bit: 1 } // Select only the required fields
    ).lean(); // Use lean() to get plain JavaScript objects

    if (!providerAvailabilities.length) {
      console.log("No providers available for booking");
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    let bookedSlot;
    let firstProvider = true;

    for (let providerAvailability of providerAvailabilities) {
      const providerId = providerAvailability.provider.toString();
      const slotIndex = getIndex(obj.startTime);
      const slotDuration = obj.slotTiming / 30;
      let availableBit = providerAvailability.available_bit;

      if (!checkConsecutive(availableBit, slotIndex, slotDuration)) {
        continue; // Skip unavailable provider
      }

      if (firstProvider) {
        // Create `bookedSlot` with the first available provider
        bookedSlot = new BookedSlot({
          providers: [convertStringToObjectId(providerId)],
          service: convertStringToObjectId(obj.serviceId),
          date: obj.date,
          start_time: convertTimeToDate(obj.startTime),
          end_time: convertTimeToDate(obj.endTime),
          slotTiming: obj.slotTiming,
        });

        await bookedSlot.save({ session });
        firstProvider = false;
      } else {
        // Push providerId to existing bookedSlot
        if (bookedSlot) {
          bookedSlot.providers.push(convertStringToObjectId(providerId));
        }
      }
    }

    if (!bookedSlot) {
      console.log("No suitable providers found");
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    await bookedSlot.save({ session });

    // Create the Booking document
    const booking = new Booking({
      user: obj.userId,
      cart: obj.cartId,
      bookingSlot_id: bookedSlot.id,
      bookingDate: new Date(),
      scheduledTime: true,
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
          ],
        },
      },
    });

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return bookedSlot;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new ErrorHandler(error.message, 501);
  }
};


export const formatTime = (date: Date): string => {
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


// export const getIndex = (startTime: string): number => {
//   let [currHour, currMinute] = startTime.split(":").map(Number);

//   // Convert hours and minutes into 15-minute slots
//   return currHour * 4 + Math.floor(currMinute / 15);
// };

export const getIndex = (startTime: string): number => {
  let [time, modifier] = startTime.split(" "); // Split "08:00 AM" -> ["08:00", "AM"]
  let [currHour, currMinute] = time.split(":").map(Number); // Convert "08:00" -> [8, 0]

  // Convert 12-hour format to 24-hour format
  if (modifier === "pm" && currHour !== 12) {
    currHour += 12; // Convert PM hours (except 12 PM)
  }
  if (modifier === "am" && currHour === 12) {
    currHour = 0; // Convert 12 AM to 0 hours
  }

  // Convert hours and minutes into 15-minute slots
  return currHour * 4 + Math.floor(currMinute / 15);
};



export const checkConsecutive = (
  available_bit: string,
  timeIndex: number,
  numberOfSlots: number
): boolean => {
  console.log("checkconsucutive",available_bit,timeIndex,numberOfSlots);
  if (timeIndex < 0 || timeIndex + numberOfSlots > available_bit.length)
    return false;

  // Check left boundary (if not the first slot)
  if (timeIndex > 0 && available_bit[timeIndex - 1] === "0") {
    return false;
  }

  // Check if all required slots are available
  for (let i = timeIndex; i < timeIndex + numberOfSlots; i++) {
    if (available_bit[i] === "0") {
      return false; // Slot already booked
    }
  }

  // Check right boundary (if not the last slot)
  if (
    timeIndex + numberOfSlots < available_bit.length &&
    available_bit[timeIndex + numberOfSlots] === "0"
  ) {
    return false;
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
