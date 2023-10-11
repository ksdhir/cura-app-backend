import express from "express";
import {
  caregiverProfile,
  caregiverProfileCreation,
  caregiverProfilePatch,
} from "../controllers/caregiverController";

const caregiverRouter = express.Router();

caregiverRouter.post("/:id", caregiverProfileCreation);
caregiverRouter.put("/:id", caregiverProfilePatch);
caregiverRouter.get("/:id", caregiverProfile);

export default caregiverRouter;
