import express from "express";
import {
  caregiverProfile,
  caregiverProfileCreation,
  caregiverNotificationLog,
  storePushNotificationToken
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


// Get all notifications log by type and elder in descending order timestamp
caregiverRouter.get("/all-notification-log", caregiverNotificationLog);
// Get latest notification record by type and elder

caregiverRouter.get("/store-push-notification-token", storePushNotificationToken);


export default caregiverRouter;
