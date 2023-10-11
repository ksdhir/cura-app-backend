import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// @route   POST /api/caregiver/:id
// @access  Public
// BLOCKER: need Google Auth to implement this
const caregiverProfileCreation = asyncHandler(
  async (req: Request, res: Response) => {
    //   id  String  @id @default(auto()) @map("_id") @db.ObjectId
    //   name String?
    //   preferredName String?
    //   email String @unique
    //   phoneNumber String?
    //   notifications Notification[]
    //   elderProfiles ElderProfile[]
    //   requestToken String? //TODO: ask meraldo about this
    // }

    res.send("Caregiver is running...");
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
