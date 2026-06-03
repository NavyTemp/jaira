import { EventEmitter } from "events";
import confirmEmailTemplate from "../../service/codeTemplite.js";
import { sendEmail } from "../../service/modemailer.js";

export const emitter = new EventEmitter();

emitter.on("sendEmail", async (data) => {
  try {
    const { email, code, userName } = data;
    await sendEmail({
      to: email,
      subject: "confirm email",
      html: confirmEmailTemplate({ code, userName: userName || "user", email }),
    });
  } catch (err) {
    console.error("sendEmail event failed:", err.message);
  }
});

emitter.on("forgetPassword", async (data) => {
  try {
    const { email, otp } = data;
    await sendEmail({
      to: email,
      subject: "forget password",
      html: confirmEmailTemplate({ code: otp, userName: "user", email }),
    });
  } catch (err) {
    console.error("forgetPassword event failed:", err.message);
  }
});