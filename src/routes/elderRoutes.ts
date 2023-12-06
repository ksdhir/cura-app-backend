import {
  addEmergencyContact,
  appendNotificationRecord,
  getElderHeartRateDetail,
  getElderHeartRateThreshold,
  getProfileDetails,
  removeEmergencyContact,
  setElderHeartRateDetail,
  updateElderHeartRateThreshold,
  upsertProfile,
  heartRateDataVisualisationWeekly,
  heartRateDataVisualisationDaily,
  reverseGeocoding,
} from "../controllers/elderController";
import express from "express";

// middleware firebase auth
import authTokenVerifyMiddleware from "../middlewares/authMiddleware";

const elderRouter = express.Router();

// profile routes
elderRouter.post("/profile", authTokenVerifyMiddleware, upsertProfile);
elderRouter.get("/profile", authTokenVerifyMiddleware, getProfileDetails);

// heart rate details routes
elderRouter.post(
  "/heart-rate-details",
  authTokenVerifyMiddleware,
  setElderHeartRateDetail
);
// TODO: how long? last 7 days or last 30 days data.
elderRouter.get(
  "/heart-rate-details",
  authTokenVerifyMiddleware,
  getElderHeartRateDetail
);

//Emergency Contact
elderRouter.post(
  "/add-emergency-contact",
  authTokenVerifyMiddleware,
  addEmergencyContact
);
elderRouter.post(
  "/remove-emergency-contact",
  authTokenVerifyMiddleware,
  removeEmergencyContact
);

//Heart Rate Threshold
elderRouter.patch(
  "/heart-threshold",
  authTokenVerifyMiddleware,
  updateElderHeartRateThreshold
);
elderRouter.get(
  "/heart-threshold",
  authTokenVerifyMiddleware,
  getElderHeartRateThreshold
);

//Notification Log
elderRouter.post(
  "/append-notification-record",
  authTokenVerifyMiddleware,
  appendNotificationRecord
);

// data visualisation apis
elderRouter.get(
  "/weekly-heart-rate-data-visualisation",
  authTokenVerifyMiddleware,
  heartRateDataVisualisationWeekly
);
elderRouter.get(
  "/daily-heart-rate-data-visualisation",
  authTokenVerifyMiddleware,
  heartRateDataVisualisationDaily
);

// Reverse Geocoding
elderRouter.get(
  "/reverse-geocode",
  authTokenVerifyMiddleware,
  reverseGeocoding
);

export default elderRouter;
