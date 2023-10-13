import {
  addEmergencyContact,
  appendNotificationLog,
  getElderHeartRateDetail,
  getProfileDetails,
  removeEmergencyContact,
  setElderHeartRateDetail,
  updateElderHeartRateThreshold,
  upsertProfile,
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

export default elderRouter;
