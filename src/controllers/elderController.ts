import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { HeartRateThreshold, PrismaClient, Prisma } from "@prisma/client";
import { MIN_HEART_RATE, MAX_HEART_RATE, HEART_RATE } from "../constants";
import admin from "firebase-admin";
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

      const beatsPerMinute = req.body.beatsPerMinute;
      const timestamp = req.body.timestamp;

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
            gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // compute average, max, min

      let weekAverage = req.body.beatsPerMinute;
      let weekMax = req.body.beatsPerMinute;
      let weekMin = req.body.beatsPerMinute;

      if (heartRateRecords) {
        weekAverage =
          heartRateRecords.reduce((acc, curr) => acc + curr.beatsPerMinute, 0) /
          heartRateRecords.length;
        weekMax = heartRateRecords.reduce(
          (acc, curr) => Math.max(acc, curr.beatsPerMinute),
          req.body.beatsPerMinute
        );
        weekMin = heartRateRecords.reduce(
          (acc, curr) => Math.min(acc, curr.beatsPerMinute),
          req.body.beatsPerMinute
        );
      }

      // ==============> SET HEART RATE Record
      const heartRateRecord = await prisma.heartRateRecord.create({
        data: {
          elderProfileId: elderId,
          beatsPerMinute: beatsPerMinute,
          timestamp: timestamp,
          weekAverage: weekAverage,
          weekMax: weekMax,
          weekMin: weekMin,
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

// @route   GET /api/elder/heart-rate-detail
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

      // ==============> GET PAST 7 DAYS HEART RATE RECORDS
      // Possibly index the timestamp column
      const heartRateRecords = await prisma.heartRateRecord.findMany({
        where: {
          elderProfileId: elderId,
          timestamp: {
            gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (heartRateRecords) {
        res.status(200).json({ heartRateRecords });
      } else {
        res.status(400).json({ message: "Heart Rate Details does not exist" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: "An error occurred" });
    }
  }
);

// @route   POST /api/elder/append-notification-record
// @access  Private
// @payload/header firebase id and token
const appendNotificationRecord = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const email = req.body.email;
      const type = req.body.type;
      // MOVEMENT_LOCATION
      // FALL_DETECTED
      // CRITICAL_HEART_RATE
      const location = req.body.location;

      // validate if elder exists in the database

      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: email.toString(),
        },
      });

      const elderId = elder.id as string;

      // append notification record in the database
      const notificationRecord = await prisma.notification.create({
        data: {
          elderProfileId: elderId,
          type: type,
          location: location,
        },
      });

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
};
