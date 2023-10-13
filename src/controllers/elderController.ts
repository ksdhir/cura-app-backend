import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// @route   POST /api/elder/heart-rate-detail
// @access  Private
// @payload/header firebase id and token
const setElderHeartRateDetail = asyncHandler(
  async (req: Request, res: Response) => {
    res.send("set elder heart rate...");
  }
);

// @route   GET /api/elder/heart-rate-detail
// @access  Private
// @payload/header firebase id and token
const getElderHeartRateDetail = asyncHandler(
  async (req: Request, res: Response) => {
    res.send("get elder heart rate...");
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
