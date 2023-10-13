import {
  addEmergencyContact,
  appendNotificationLog,
  getElderHeartRateDetail,
  getProfileDetails,
  setElderHeartRateDetail,
  updateElderHeartRateThreshold,
  upsertProfile,
} from "../controllers/elderController";
import express from "express";

const elderRouter = express.Router();

elderRouter.post("/heart-rate-detail/:id", setElderHeartRateDetail);
elderRouter.get("/heart-rate-detail/:id", getElderHeartRateDetail);
elderRouter.post("/append-notification-log/:id", appendNotificationLog);
elderRouter.patch("/update-heart-threshold/:id", updateElderHeartRateThreshold);

elderRouter.post("/profile", upsertProfile);
elderRouter.get("/profile", getProfileDetails);

//Emergency Contact
elderRouter.post("/add-emergency-contact", addEmergencyContact);

export default elderRouter;
