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
  heartRateDataVisualisationDaily
} from "../controllers/elderController";
import express from "express";

const elderRouter = express.Router();

// profile routes
elderRouter.post("/profile", upsertProfile);
elderRouter.get("/profile", getProfileDetails);

// heart rate details routes
elderRouter.post("/heart-rate-details", setElderHeartRateDetail);
// TODO: how long? last 7 days or last 30 days data.
elderRouter.get("/heart-rate-details", getElderHeartRateDetail);

//Emergency Contact
elderRouter.post("/add-emergency-contact", addEmergencyContact);
elderRouter.post("/remove-emergency-contact", removeEmergencyContact);

//Heart Rate Threshold
elderRouter.patch("/heart-threshold", updateElderHeartRateThreshold);
elderRouter.get("/heart-threshold", getElderHeartRateThreshold);

//Notification Log
elderRouter.post("/append-notification-record", appendNotificationRecord);

// data visualisation apis
elderRouter.get("/weekly-heart-rate-data-visualisation", heartRateDataVisualisationWeekly)
elderRouter.get("/daily-heart-rate-data-visualisation", heartRateDataVisualisationDaily)


export default elderRouter;
