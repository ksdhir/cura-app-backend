import asyncHandler from "express-async-handler";
import { Request, Response } from "express";

// @route   POST /api/caregiver/:id
// @access  Public
// BLOCKER: need Google Auth to implement this
const caregiverProfileCreation = asyncHandler(
  async (req: Request, res: Response) => {
    res.send("Caregiver is running...");
  }
);

// @route   PUT /api/caregiver/:id
// @access  Authenticated
const caregiverProfilePatch = asyncHandler(
  async (req: Request, res: Response) => {
    res.send("Caregiver profile is updating...");
  }
);

// @route   GET /api/caregiver/:id
// @access  Authenticated
const caregiverProfile = asyncHandler(async (req: Request, res: Response) => {
  res.send("Caregiver profile...");
});

export { caregiverProfileCreation, caregiverProfilePatch, caregiverProfile };
