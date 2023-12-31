import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { HeartRateThreshold, PrismaClient, Prisma } from "@prisma/client";
import { MIN_HEART_RATE, MAX_HEART_RATE, HEART_RATE } from "../constants";
import admin from "firebase-admin";
import sendPushNotification from "../util/sendPushNotification";
import { getISODays, getISOHours } from "../util/getISODates";

// import util functions
import ISOStartString from "../util/ISOStartString";
import { consolidateData } from "../parsers/consolidateData";

// get recommended heart rate threshold based on age
import getHeartRateThreshold from "../util/getHeartRateThreshold";

const prisma = new PrismaClient();

// Sets the heart rate of Elder person in Heart Rate Log Collection
// @route   POST /api/elder/heart-rate-details
// @access  Private
// @payload/header firebase id and token
const setElderHeartRateDetail = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // elder email
      const email = req.body.email;
      const beatsPerMinute = Number(req.body.beatsPerMinute);
      const timestamp = req.body.timestamp;

      const timezone = "America/Vancouver";
      const weekAgoStartStringUTC = ISOStartString("WeekAgo", timezone);
      const sevenDaysAgo = new Date(weekAgoStartStringUTC);
      const todayStartStringUTC = ISOStartString("Today", timezone);
      const todayStart = new Date(todayStartStringUTC);

      if (!email || !beatsPerMinute || !timestamp || beatsPerMinute == 0) {
        throw Error("Invalid Parameters");
      }

      // ==============> GET ELDER ID
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: email.toString(),
        },
      });

      if (!elder || elder.id === undefined) {
        res.status(400).json({ message: "Caregiver profile does not exist" });
      }

      const elderId = elder.id;

      // ==============> GET PAST 7 DAYS HEART RATE RECORDS
      // Possibly index the timestamp column
      const heartRateRecords = await prisma.heartRateRecord.findMany({
        where: {
          elderProfileId: elderId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
      });

      // ==============> GET PAST 7 DAYS HEART RATE RECORDS
      // Possibly index the timestamp column
      const heartRateRecordsToday = await prisma.heartRateRecord.findMany({
        where: {
          elderProfileId: elderId,
          timestamp: {
            gte: todayStart,
          },
        },
      });

      // compute average, max, min of the past 7 days

      let weekAverage = req.body.beatsPerMinute;
      let weekMax = req.body.beatsPerMinute;
      let weekMin = req.body.beatsPerMinute;

      if (heartRateRecords) {
        if (heartRateRecords.length === 0) {
          weekAverage = req.body.beatsPerMinute;
        } else {
          weekAverage =
            heartRateRecords.reduce(
              (acc, curr) => acc + curr.beatsPerMinute,
              req.body.beatsPerMinute
            ) /
            (heartRateRecords.length + 1);
        }

        weekMax = heartRateRecords.reduce(
          (acc, curr) => Math.max(acc, curr.beatsPerMinute),
          req.body.beatsPerMinute
        );

        weekMin = heartRateRecords.reduce(
          (acc, curr) => Math.min(acc, curr.beatsPerMinute),
          req.body.beatsPerMinute
        );
      }

      // compute average, max, min of the today

      let todayAverage = req.body.beatsPerMinute;
      let todayMax = req.body.beatsPerMinute;
      let todayMin = req.body.beatsPerMinute;

      if (heartRateRecordsToday || heartRateRecordsToday.length > 0) {
        todayAverage =
          heartRateRecordsToday.reduce(
            (acc, curr) => acc + curr.beatsPerMinute,
            req.body.beatsPerMinute
          ) /
          (heartRateRecordsToday.length + 1);

        todayMax = heartRateRecordsToday.reduce(
          (acc, curr) => Math.max(acc, curr.beatsPerMinute),
          req.body.beatsPerMinute
        );
        todayMin = heartRateRecordsToday.reduce(
          (acc, curr) => Math.min(acc, curr.beatsPerMinute),
          req.body.beatsPerMinute
        );
      }

      // ==============> SET HEART RATE Record
      const heartRateRecord = await prisma.heartRateRecord.create({
        data: {
          elderProfile: {
            connect: {
              id: elderId,
            },
          },
          beatsPerMinute: beatsPerMinute,
          timestamp: timestamp,
          weekAverage: weekAverage,
          weekMax: weekMax,
          weekMin: weekMin,
          todayAverage: todayAverage,
          todayMax: todayMax,
          todayMin: todayMin,
        },
      });

      if (heartRateRecord) {
        res.status(200).json({ heartRateRecord });
      } else {
        res
          .status(400)
          .json({ message: "Could not append Heart Rate Details" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: "An error occurred" });
    }
  }
);

// ==============> GET LATEST HEART RATE RECORD
// @route   GET /api/elder/heart-rate-details
// @access  Private
// @payload/header firebase id and token
const getElderHeartRateDetail = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // elder email
      const email = req.query.email;

      // ==============> GET ELDER ID
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: email.toString(),
        },
      });

      if (!elder || elder.id === undefined) {
        res.status(400).json({ message: "Elder profile does not exist" });
      }

      const elderId = elder.id;

      // ==============> GET LATEST HEART RATE RECORD
      // Possibly index the timestamp column
      const heartRateRecords = await prisma.heartRateRecord.findMany({
        where: {
          elderProfileId: elderId,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
      });

      if (heartRateRecords) {
        res.status(200).json({ latestHeartRateRecord: heartRateRecords });
      } else {
        res.status(400).json({ message: "Heart Rate Details does not exist" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: "An error occurred" });
    }
  }
);

const heartRateDataVisualisationWeekly = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // elder email
      const email = req.query.email;
      const timezone = "America/Vancouver";
      const weekAgoStartStringUTC = ISOStartString("WeekAgo", timezone);
      const sevenDaysAgo = new Date(weekAgoStartStringUTC);

      // ==============> GET ELDER ID
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: email.toString(),
        },
      });

      if (!elder || elder.id === undefined) {
        res.status(400).json({ message: "Elder profile does not exist" });
      }

      const elderId = elder.id;

      const heartRateRecords = await prisma.heartRateRecord.findMany({
        where: {
          elderProfileId: elderId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
      });

      // ===============================> CONSOLIDATE DATA WITHIN WEEK
      const consolidatedData = consolidateData(
        "week",
        heartRateRecords,
        getISODays()
      );

      if (heartRateRecords) {
        res.status(200).json({ consolidatedData });
      } else {
        res.status(400).json({ message: "Heart Rate Details does not exist" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: "Could not process heart rate details" });
    }
  }
);

const heartRateDataVisualisationDaily = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // elder email
      const email = req.query.email;
      const timezone = "America/Vancouver";
      const startDateUTCString = ISOStartString("Today", timezone);

      const sevenDaysAgo = new Date(startDateUTCString);

      // ==============> GET ELDER ID
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: email.toString(),
        },
      });

      if (!elder || elder.id === undefined) {
        res.status(400).json({ message: "Elder profile does not exist" });
      }

      const elderId = elder.id;

      const heartRateRecords = await prisma.heartRateRecord.findMany({
        where: {
          elderProfileId: elderId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
      });

      // ===============================> CONSOLIDATE DATA WITHIN WEEK
      const consolidatedData = consolidateData(
        "day",
        heartRateRecords,
        getISOHours()
      );

      if (heartRateRecords) {
        res.status(200).json({ consolidatedData });
      } else {
        res.status(400).json({ message: "Heart Rate Details does not exist" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: "Could not process heart rate details" });
    }
  }
);

async function reverseGeocodeTomTom(latitude: any, longitude: any) {
  try {
    const tomtomapi = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?radius=10000&key=${process.env.TOMTOM_API_KEY}`;

    const response = await fetch(tomtomapi);
    const data = await response.json();

    return data;
  } catch (error) {
    throw new Error("Could not reverse geocode");
  }
}


const reverseGeocoding = asyncHandler(
  async (req: Request, res: Response) => {
    try {

      const latitude = req.query.latitude;
      const longitude = req.query.longitude;

      const data = await reverseGeocodeTomTom(latitude, longitude);

      if (!data.addresses || !data.summary || !data.summary.numResults) {
        res.status(400).json({ message: "Could not find location" });
        return;
      }

      if (!data.addresses || !data.summary || !data.summary.numResults) {
        res.status(400).json({ message: "Could not find location" });
        return;
      }

      if (data.error) {
        res.status(400).json({ message: data.error });
      }

      const freeformAddress = data.addresses[0].address.freeformAddress;

      res.status(200).json({ address: freeformAddress });
    } catch (error) {
      console.error("Error: ", error);
      // throw new Error("Error in reverse geocoding")
      res.status(400).json({ message: "Error in reverse geocoding" });
    }
  }
);

// TODO implement reverse geocding here

// @route   POST /api/elder/append-notification-record
// @access  Private
// @payload/header firebase id and token
const appendNotificationRecord = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const email = req.body.email;
      const type = req.body.type;
      const payload = req.body.payload ?? null;

      if (
        type !== "MOVEMENT_LOCATION" &&
        type !== "FALL_DETECTED" &&
        type !== "CRITICAL_HEART_RATE" &&
        type !== "TEST_NOTIFICATION"
      ) {
        throw Error("Invalid notification type");
      }

      // MOVEMENT_LOCATION
      // FALL_DETECTED
      // CRITICAL_HEART_RATE
      const location = req.body.location;

      // validate elder first and get his caregiver notification tokens
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: email.toString(),
        },
        include: {
          caregiversDoc: true,
        },
      });

      const elderId = elder.id as string;

      // validation
      if (!elder || !elderId) {
        throw Error("Elder does not exists");
      }

      // ===============================> TEST NOTIFICATION STARTS
      if (type === "TEST_NOTIFICATION") {
        const careGiverTokens = elder.caregiversDoc
          .map((caregiver) => {
            return caregiver.requestToken;
          })
          .filter((token) => {
            return token !== "" && token !== null && token !== undefined;
          });

        // test notification and return
        sendPushNotification(
          careGiverTokens,
          "Test CURA Notification",
          "This is a test notification"
        );

        res
          .status(200)
          .json({ message: "Test notification sent", careGiverTokens });
        return;
      }

      // ===============================> TEST NOTIFICATION ENDS



      // if type is MOVEMENT_LOCATION, then reverse geocode the latitude and longitude to get the address
      if (type === "MOVEMENT_LOCATION" || type === "FALL_DETECTED") {
        const latitude = payload.location.latitude;
        const longitude = payload.location.longitude;
        const data = await reverseGeocodeTomTom(latitude, longitude);

        if (!data.addresses || !data.summary || !data.summary.numResults) {
          res.status(400).json({ message: "Could not find location" });
          return;
        }
  
        if (!data.addresses || !data.summary || !data.summary.numResults) {
          res.status(400).json({ message: "Could not find location" });
          return;
        }
  
        if (data.error) {
          res.status(400).json({ message: "Could not find location" });
        }
  
        const freeformAddress = data.addresses[0].address.freeformAddress;
        payload.location.address = freeformAddress;
        // console.log(freeformAddress)
      }


      // append notification record in the database
      const notificationRecord = await prisma.notification.create({
        data: {
          elderProfileId: elderId,
          type: type,
          payload,
        },
      });

      // ====================> SEND ELDER NOTIFICATION
      const careGiverTokens = elder.caregiversDoc
        .map((caregiver) => {
          return caregiver.requestToken;
        })
        .filter((token) => {
          return token !== "" && token !== null && token !== undefined;
        });

      // ======================================> Different Kinds of Notifications
      if (type === "CRITICAL_HEART_RATE") {
        sendPushNotification(
          careGiverTokens,
          "Elder Critical Heart Rate Detected",
          "Your elder has a critical heart rate. Click to view more.",
          { payload, type, elderEmail: email }
        );
      } else if (type == "FALL_DETECTED") {
        sendPushNotification(
          careGiverTokens,
          "Elder Fall Detected",
          "Your elder might have fell down. Contact and connect now.",
          {
            payload,
            type,
            elderEmail: email,
            elderPhoneNumber: elder.phoneNumber,
            elderName: elder.name,
          }
        );
      } else if (type == "MOVEMENT_LOCATION") {
        sendPushNotification(
          careGiverTokens,
          "Elder Far from Home",
          "Your elder seems to be far from Home. Click to view current location.",
          { payload, type, elderEmail: email }
        );
      }
      // ======================================> Different Kinds of Notifications END

      if (notificationRecord) {
        res.status(200).json({ notificationRecord });
      } else {
        throw Error("Could not append Notification Record");
      }
    } catch (error) {
      res.status(400).json({
        message: "Could not append Notification Record",
        detail: error.message,
      });
    }
  }
);

const upsertProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.email) {
    res.status(400).json({
      message: "Missing email",
    });
  }

  if (!req.body.age) {
    res.status(400).json({
      message: "Missing Age",
    });
  }

  try {
    const user = await admin.auth().getUserByEmail(req.body.email);

    if (!user) {
      throw Error("User does not exist");
    }

    if (!(user.customClaims && user.customClaims.profileType)) {
      admin.auth().setCustomUserClaims(user.uid, {
        profileType: "Elder",
      });
    }

    // calculate the minimum and maximum heart rate depending on the age
    const age = req.body.age;
    const threshold = getHeartRateThreshold(age);

    const elder = await prisma.elderProfile.upsert({
      where: {
        email: req.body.email,
      },
      update: {
        name: req.body.name,
        preferredName: req.body.preferredName ?? req.body.name,
        phoneNumber: req.body.phoneNumber,
        age: req.body.age,
        defaultLocation: req.body.defaultLocation,
        sex: req.body.sex ?? "PREFER_NOT_TO_SAY",
        bloodType: req.body.bloodType ?? null,
        notes: req.body.notes ?? null,
        medications: req.body.medications ?? null,
        medicalConditions: req.body.medicalConditions ?? null,
        allergies: req.body.allergies ?? null,
      },
      create: {
        email: req.body.email,
        name: req.body.name,
        preferredName: req.body.preferredName ?? req.body.name,
        phoneNumber: req.body.phoneNumber,
        age: req.body.age,
        defaultLocation: req.body.defaultLocation,
        sex: req.body.sex ?? "PREFER_NOT_TO_SAY",
        bloodType: req.body.bloodType ?? null,
        notes: req.body.notes ?? null,
        medications: req.body.medications ?? null,
        medicalConditions: req.body.medicalConditions ?? null,
        allergies: req.body.allergies ?? null,
        heartRateThreshold: {
          minimum: threshold.min,
          maximum: threshold.max,
        },
        careGiverRelationships: {},
      },
    });

    res.json({
      message: "Successfully upsert caregiver profile",
      profile: elder,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Failed to upsert elder profile",
      detail: error.message,
    });
  }
});

const getProfileDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.query.email) {
    res.status(400).json({
      message: "Invalid Query Params",
    });
  }

  try {
    const elder = await prisma.elderProfile.findUnique({
      where: {
        email: req.query.email as string,
      },
    });

    if (!elder) throw new Error("Elder not found");

    res.status(400).json({
      message: "Successfully fetched elder profile",
      profile: elder,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch elder profile",
    });
  }
});

// @route   POST /api/elder/add-emergency-contact
// @access  Private
// @payload/header firebase id and token

const addEmergencyContact = asyncHandler(
  async (req: Request, res: Response) => {
    //email is the owner of the profile
    //contactEmail is the email of the caregiver to be added as emergency contact
    //email and contactEmail must be different
    if (
      (!req.body.email ||
        !req.body.contactEmail ||
        req.body.email === req.body.contactEmail,
      !req.body.relationship)
    ) {
      res.status(400).json({
        message:
          "Invalid Request: missing some either of params: email, contactEmail, relationship",
      });
    }

    try {
      // ==================> VALIDATION: Check if the Caregiver Profile exists
      const caregiver = await prisma.careGiverProfile.findUnique({
        where: {
          email: req.body.contactEmail as string,
        },
      });

      if (!caregiver) throw new Error("Caregiver not found");

      // Validation: Check if the elder profile exists
      const elderProfile = await prisma.elderProfile.findUnique({
        where: {
          email: req.body.email as string,
        },
      });

      if (!elderProfile) throw new Error("Elder not found");

      // res.status(200).json({
      //   elderProfile
      // })

      // Add Elder Id and Caregiver id to each document

      // add elderId to caregiver profile
      const elderIds = caregiver.elderIds ?? [];
      if (!elderIds.includes(elderProfile.id)) {
        elderIds.push(elderProfile.id);
      }

      const updatedCaregiver = await prisma.careGiverProfile.update({
        where: {
          email: req.body.contactEmail as string,
        },
        data: {
          elderIds: elderIds,
        },
      });

      if (!updatedCaregiver)
        throw new Error("Failed to update caregiver profile");

      // add caregiverId to elder profile
      const caregiverIds = elderProfile.careGiverIds ?? [];
      if (!caregiverIds.includes(caregiver.id)) {
        caregiverIds.push(caregiver.id);
      }

      const careGiverRelationships =
        (elderProfile.careGiverRelationships as Prisma.JsonObject) ??
        ({} as Prisma.JsonObject);
      careGiverRelationships[updatedCaregiver?.email] = req.body.relationship;

      const updatedElderProfile = await prisma.elderProfile.update({
        where: {
          email: req.body.email as string,
        },
        data: {
          careGiverIds: caregiverIds,
          careGiverRelationships: careGiverRelationships,
        },
      });

      if (!updatedElderProfile || !updatedCaregiver)
        throw new Error("Failed to update elder profile and caregiver profile");

      res.status(200).json({
        careGiverRelationships: updatedElderProfile.careGiverRelationships,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        message: "Failed to add emergency contact",
        detail: error.message,
      });
    }
  }
);

const removeEmergencyContact = asyncHandler(
  async (req: Request, res: Response) => {
    //email is the owner of the profile
    //contactEmail is the email of the caregiver to be added as emergency contact
    //email and contactEmail must be different
    if (
      !req.body.email ||
      !req.body.contactEmail ||
      req.body.email === req.body.contactEmail
    ) {
      res.status(400).json({
        message: "Invalid Request",
      });
    }

    try {
      //Check if the elder exists
      //Check if the caregiver is already an emergency contact
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: req.body.email as string,
        },
      });

      const caregiver = await prisma.careGiverProfile.findUnique({
        where: {
          email: req.body.contactEmail as string,
        },
      });

      if (!elder) throw new Error("Elder does not exist");

      // remove from elder profile
      // remove relationship as well
      const careGiverRelationships =
        elder.careGiverRelationships as Prisma.JsonObject;
      delete careGiverRelationships[req.body.contactEmail as string];

      const newCareGiverIds = elder.careGiverIds.filter((caregiverId) => {
        return caregiverId !== caregiver.id;
      });

      const updatedElder = await prisma.elderProfile.update({
        where: {
          email: req.body.email as string,
        },
        data: {
          careGiverRelationships,
          careGiverIds: newCareGiverIds,
        },
      });

      // remove elderId from caregiver profile
      const newElderIds = caregiver.elderIds.filter((elderId) => {
        return elderId !== elder.id;
      });

      const updatedCaregiver = await prisma.careGiverProfile.update({
        where: {
          email: req.body.contactEmail as string,
        },
        data: {
          elderIds: newElderIds,
        },
      });

      if (!updatedElder || !updatedCaregiver)
        throw new Error("Failed to remove emergency contact");

      res.status(200).json({
        message: "Successfully removed an emergency contact",
        newCareGiverIds,
        newElderIds,
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to remove emergency contact",
        detail: error.message,
      });
    }
  }
);

// @route   PATCH /api/elder/update-heart-threshold
// @access  Private
// @payload/header firebase id and token
const updateElderHeartRateThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.body.email || !req.body.minimum || !req.body.maximum) {
      res.status(400).json({
        message: "Invalid Parameters",
      });
    }

    try {
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: req.body.email as string,
        },
      });

      if (!elder) throw new Error("Elder not found");

      const updated = await prisma.elderProfile.update({
        where: {
          email: req.body.email as string,
        },
        data: {
          heartRateThreshold: {
            minimum: req.body.minimum,
            maximum: req.body.maximum,
          },
        },
      });

      res.json({
        message: "Threshold has been updated",
        detail: updated.heartRateThreshold,
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to update elder heart rate threshold",
        detail: error.message,
      });
    }
  }
);

// @route   GET /api/elder/heart-threshold
// @access  Private
// @payload/header firebase id and token
const getElderHeartRateThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.query.email) {
      res.status(400).json({
        message: "Missing email",
      });
    }

    try {
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: req.query.email as string,
        },
      });

      if (!elder) throw new Error("Elder not found");

      res.json({
        message: "Threshold fetched successfully",
        detail: elder.heartRateThreshold,
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to fetch elder heart rate threshold",
        detail: error.message,
      });
    }
  }
);

export {
  setElderHeartRateDetail,
  getElderHeartRateDetail,
  appendNotificationRecord,
  updateElderHeartRateThreshold,
  getElderHeartRateThreshold,
  upsertProfile,
  getProfileDetails,
  addEmergencyContact,
  removeEmergencyContact,
  heartRateDataVisualisationWeekly,
  heartRateDataVisualisationDaily,
  reverseGeocoding,
};
