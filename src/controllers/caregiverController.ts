import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// @route   POST /api/caregiver/profile
// @access  Authenticated
const caregiverProfileCreation = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const caregiver = await prisma.careGiverProfile.upsert({
        where: {
          email: req.body.email,
        },
        update: {
          name: req.body.name,
          preferredName: req.body.preferredName,
          phoneNumber: req.body.phoneNumber,
          requestToken: req.body.requestToken ?? null,
        },
        create: {
          name: req.body.name,
          preferredName: req.body.preferredName,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          requestToken: req.body.requestToken ?? null,
        },
      });

      if (caregiver) {
        res
          .status(200)
          .json({ message: "Caregiver profile created successfully" });
      } else {
        res
          .status(400)
          .json({ message: "Query failed to update user profile" });
      }
    } catch (error) {
      // Handle the error, log it, and send an error response to the client
      // console.error('Error in caregiverProfileCreation:', error);
      res.status(400).json({ errorx: "An error occurred", error: error });
    }
  }
);

// @route   GET /api/caregiver/profile
// @access  Authenticated
const caregiverProfile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const email = req.query.email;
    const caregiver = await prisma.careGiverProfile.findUnique({
      where: {
        email: email.toString(),
      },
    });

    // remove unwanted params
    delete caregiver?.id;
    delete caregiver?.requestToken;

    if (caregiver) {
      res.status(200).json({ caregiver });
    } else {
      res.status(400).json({ message: "Caregiver profile does not exist" });
    }
  } catch (error) {
    res.status(400).json({ errorx: "An error occurred", error: error });
  }
});

export { caregiverProfileCreation, caregiverProfile };
