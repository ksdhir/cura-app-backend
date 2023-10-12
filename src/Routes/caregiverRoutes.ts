import express from "express";
import {
  caregiverProfile,
  caregiverProfileCreation,
} from "../controllers/caregiverController";

// middleware firebase auth
import authTokenVerifyMiddleware from "../middlewares/authMiddleware";

const caregiverRouter = express.Router();

// profile routes
caregiverRouter.post(
  "/profile",
  authTokenVerifyMiddleware,
  caregiverProfileCreation
);
caregiverRouter.get("/profile", caregiverProfile);

export default caregiverRouter;
