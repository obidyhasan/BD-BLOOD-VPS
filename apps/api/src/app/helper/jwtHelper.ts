import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { IJWTPayload } from "../types";

const generateToken = (payload: any, secret: Secret, expiresIn: string) => {
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  } as SignOptions);

  return token;
};

const verifyToken = (token: string, secret: Secret): IJWTPayload => {
  const payload = jwt.verify(token, secret);

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid JWT payload");
  }

  return payload as IJWTPayload;
};

export const jwtHelper = {
  generateToken,
  verifyToken,
};
