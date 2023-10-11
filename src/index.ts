import express from "express";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import "dotenv/config";
import { notFound, errorHandler } from "./middlewares/errorMiddleware";
import admin from "firebase-admin";

//Routes
import sampleRoutes from "./routes/sampleRoutes";
import caregiverRouter from "./routes/caregiverRoutes";
import elderRouter from "./routes/elderRoutes";

const serviceAccount = require("./util/cura-5aa30-firebase-adminsdk-41ht6-6560710166.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const SERVER_PORT = process.env.PORT || 5000;

const app = express();

// CORS configuration
app.use(
  cors({
    credentials: true,
  })
);

// Express configuration
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

// Routes
app.use("/api", sampleRoutes);
app.use("/api/caregiver", caregiverRouter);
app.use("/api/elder", elderRouter);

// Middlewares
app.use(notFound);
app.use(errorHandler);

// Initialize Server and listen on port
const server = http.createServer(app);
server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});
