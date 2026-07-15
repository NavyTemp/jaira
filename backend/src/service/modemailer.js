import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: process.env.EMAIL, 
      pass: process.env.PASSWORD, 
    },
  });

  const info = await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL}>`, 
    to,
    subject:subject|| "test email",
    html:html||  "<b> Hello ? </b>",
    attachments: attachments || [],
  });
  if (info.accepted.length > 0) {
    return true;
  } else return false;
};
