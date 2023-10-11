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

export {
  setElderHeartRateDetail,
  getElderHeartRateDetail,
  appendNotificationLog,
  updateElderHeartRateThreshold,
};
