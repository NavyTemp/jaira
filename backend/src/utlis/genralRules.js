 import { z } from "zod";
 
 export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

 export const egyptPhoneRegex = /^(010|011|012|015)[0-9]{8}$/;
  export const objectId = z
   .string()
   .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
