import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
        res.status(400).json({ message: "Could not append Heart Rate Details" });
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

// @route   POST /api/elder/append-notification-log
// @access  Private
// @payload/header firebase id and token
const appendNotificationLog = asyncHandler(
  async (req: Request, res: Response) => {
    res.send("appending notificaiton...");
  }
);

// @route   PATCH /api/elder/update-heart-threshold
// @access  Private
// @payload/header firebase id and token
const updateElderHeartRateThreshold = asyncHandler(
  async (req: Request, res: Response) => {
    res.send("update heart rate threshold...");
  }
);

const upsertProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.email) {
    res.status(400).json({
      message: "Missing email",
    });
  }

  try {
    const elder = await prisma.elderProfile.upsert({
      where: {
        email: req.body.email,
      },
      update: {
        name: req.body.name,
        preferredName: req.body.preferredName,
        phoneNumber: req.body.phoneNumber,
        age: req.body.age,
        sex: req.body.sex ?? "PREFER_NOT_TO_SAY",
        bloodType: req.body.bloodType ?? null,
        notes: req.body.notes ?? null,
        medications: req.body.medications ?? null,
        medicalConditions: req.body.medicalConditions ?? null,
        allergies: req.body.allergies ?? null,
      },
      create: {
        email: req.body.email,
        name: req.body.name ?? null,
        preferredName: req.body.preferredName ?? null,
        phoneNumber: req.body.phoneNumber ?? null,
        age: req.body.age ?? null,
        sex: req.body.sex ?? "PREFER_NOT_TO_SAY",
        bloodType: req.body.bloodType ?? null,
        notes: req.body.notes ?? null,
        medications: req.body.medications ?? null,
        medicalConditions: req.body.medicalConditions ?? null,
        allergies: req.body.allergies ?? null,
      },
    });

    res.json({
      message: "Successfully upsert caregiver profile",
      profile: elder,
      body: req.body,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to upsert elder profile",
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

const addEmergencyContact = asyncHandler(
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
      //Check if the caregiver exists
      const caregiver = await prisma.careGiverProfile.findUnique({
        where: {
          email: req.body.contactEmail as string,
        },
      });

      if (!caregiver) throw new Error("Caregiver not found");

      //Check if the elder exists
      //Check if the caregiver is already an emergency contact
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: req.body.email as string,
          emergencyContactRelationships: {
            some: {
              email: req.body.contactEmail as string,
            },
          },
        },
      });

      if (elder) throw new Error("Caregiver is already an emergency contact");

      await prisma.elderProfile.update({
        where: {
          email: req.body.email as string,
        },
        data: {
          emergencyContactRelationships: {
            push: {
              email: req.body.contactEmail as string,
              relationship: req.body.relationship ?? null,
            },
          },
        },
      });

      res.status(400).json({
        message: "Successfully added an emergency contact",
      });
    } catch (error) {
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
          emergencyContactRelationships: {
            some: {
              email: req.body.contactEmail as string,
            },
          },
        },
      });

      if (!elder) throw new Error("Caregiver is not in the emergency contact");

      await prisma.elderProfile.update({
        where: {
          email: req.body.email as string,
        },
        data: {
          emergencyContactRelationships: {
            set: elder.emergencyContactRelationships.filter(
              (person) => person.email !== req.body.contactEmail
            ),
          },
        },
      });

      res.status(400).json({
        message: "Successfully removed an emergency contact",
      });
    } catch (error) {
      res.status(400).json({
        message: "Failed to remove emergency contact",
        detail: error.message,
      });
    }
  }
);

export {
  setElderHeartRateDetail,
  getElderHeartRateDetail,
  appendNotificationLog,
  updateElderHeartRateThreshold,
  upsertProfile,
  getProfileDetails,
  addEmergencyContact,
  removeEmergencyContact,
};
