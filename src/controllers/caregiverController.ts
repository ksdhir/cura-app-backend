import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// @route   POST /api/caregiver/profile
// @access  Public
// BLOCKER: need Google Auth to implement this
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

// @route   PATCH /api/caregiver/:id
// @access  Authenticated
const caregiverProfilePatch = asyncHandler(
  async (req: Request, res: Response) => {
    //get the id wildcard
    const id = req.params.id;

    //   name String?
    //   preferredName String?
    //   phoneNumber String?

    // const updateUser = await prisma.user.update({
    //   where: {
    //     email: 'viola@prisma.io',
    //   },
    //   data: {
    //     name: 'Viola the Magnificent',
    //   },
    // })

    res.send("Caregiver profile is updating...");
  }
);

// @route   GET /api/caregiver/:id
// @access  Authenticated
const caregiverProfile = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  const caregiver = await prisma.careGiverProfile.findUnique({
    where: {
      email: "test@gmail.com",
    },
  });

  res.send({
    res: caregiver,
    message: "Caregiver profile...",
  });
});

export { caregiverProfileCreation, caregiverProfilePatch, caregiverProfile };
