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

export {
  setElderHeartRateDetail,
  getElderHeartRateDetail,
  appendNotificationLog,
  updateElderHeartRateThreshold,
  upsertProfile,
};
