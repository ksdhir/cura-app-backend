import {
  appendNotificationLog,
  getElderHeartRateDetail,
  setElderHeartRateDetail,
  updateElderHeartRateThreshold,
} from "../controllers/elderController";
import express from "express";

const elderRouter = express.Router();

elderRouter.post("/heart-rate-detail/:id", setElderHeartRateDetail);
elderRouter.get("/heart-rate-detail/:id", getElderHeartRateDetail);
elderRouter.post("/append-notification-log/:id", appendNotificationLog);
elderRouter.patch("/update-heart-threshold/:id", updateElderHeartRateThreshold);

export default elderRouter;
