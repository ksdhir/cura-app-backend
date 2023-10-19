import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { PrismaClient, NotificationType } from "@prisma/client";
import admin from "firebase-admin";

const prisma = new PrismaClient();

// @route   POST /api/caregiver/profile
// @access  Authenticated
const caregiverProfileCreation = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = await admin.auth().getUserByEmail(req.body.email);

      if (!user) {
        throw Error("User does not exist");
      }

      if (!(user.customClaims && user.customClaims.profileType)) {
        admin.auth().setCustomUserClaims(user.uid, {
          profileType: "Caregiver",
        });
      }

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

// @route   GET /api/caregiver/all-notification-log
// @access  Authenticated
const caregiverNotificationLog = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const elderEmail = req.query.elderEmail;
      const type = req.query.type;

      // validation if elder exists
      const elder = await prisma.elderProfile.findUnique({
        where: {
          email: elderEmail.toString(),
        },
      });

      if (!elder) {
        throw Error("Elder does not exists");
      }

      const elderId = elder.id;

      const notificationLog = await prisma.notification.findMany({
        where: {
          elderProfileId: elderId,
          type: type as NotificationType,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      if (notificationLog) {
        res.status(200).json({ notificationLog });
      } else {
        throw Error("No notification log found");
      }
    } catch (error) {
      res.status(400).json({ errorx: "An error occurred", error: error });
    }
  }
);

// @route   GET /api/caregiver/store-push-notification-token
// @access  Authenticated
const storePushNotificationToken = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const email = req.query.email;
      const token = req.query.token;

      if (!email || !token) {
        throw new Error("Email or token is missing");
      }

      const caregiver = await prisma.careGiverProfile.update({
        where: {
          email: email.toString(),
        },
        data: {
          requestToken: token.toString(),
        },
      });

      if (caregiver) {
        res
          .status(200)
          .json({ message: "Push notification token stored successfully" });
      } else {
        res
          .status(400)
          .json({ message: "Failed to store push notification token" });
      }
    } catch (error) {
      res.status(406).json({ errorx: "An error occurred", error: error });
    }
  }
);

export {
  caregiverProfileCreation,
  caregiverProfile,
  caregiverNotificationLog,
  storePushNotificationToken,
};
