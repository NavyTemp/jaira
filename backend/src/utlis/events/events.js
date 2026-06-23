import { EventEmitter } from "events";
import confirmEmailTemplate from "../../service/codeTemplite.js";
import forgotPasswordTemplate from "../../service/otp.templite.js";
import { sendEmail } from "../../service/modemailer.js";

export const emitter = new EventEmitter();

emitter.on("sendEmail", async (data) => {
  try {
    const { email, code, userName } = data;
    await sendEmail({
      to: email,
      subject: "Email Verification",
      html: confirmEmailTemplate({ code, userName: userName || "user" }),
    });
  } catch (err) {
    console.error("sendEmail event failed:", err.message);
  }
});

emitter.on("forgetPassword", async (data) => {
  try {
    const { email, otp, userName } = data;
    await sendEmail({
      to: email,
      subject: "Password Reset",
      html: forgotPasswordTemplate({ code: otp, userName: userName || "user" }),
    });
  } catch (err) {
    console.error("forgetPassword event failed:", err.message);
  }
});