import asyncHandler from "express-async-handler";
import { Request, Response } from "express";

// @desc    Sample Controller
// @route   GET /api/sample
// @access  Public
const sampleController = asyncHandler(async (req: Request, res: Response) => {
  res.send("API is running...");
});

export { sampleController };
