import { NextFunction, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";

const authTokenVerifyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tokenString = req.headers["authorization"]?.split(" ") ?? null;

  if (!tokenString || !tokenString[1]) {
    res.status(401).send("You are not authorized.");
    return;
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(tokenString[1]);
    const uid = decodedToken.uid;

    next();
  } catch (error) {
    res.status(401).send("You are not authorized.");
    return;
  }
};

export default authTokenVerifyMiddleware;
