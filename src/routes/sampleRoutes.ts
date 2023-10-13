import express, { Request, Response } from "express";
import { sampleController } from "../controllers/sampleController";

const router = express.Router();

// router.get("/", (req: Request, res: Response) => {
//   res.send("API is running...");
// });

router.get("/", sampleController);

export default router;
