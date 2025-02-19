import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();
interface EmailOptions {
  to: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  companyName: string;
  companyVenue: string;
  loginUrl: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: false,
  auth: {
    user: "deepak2198.be21@chitkara.edu.in", // Your Gmail email
    pass: "ptckt wlwx vjnr uraw", // Your Gmail app password (Not your real password!)
  },
});
const getEmailTemplate = (options: EmailOptions): string => {
  // Get the absolute path of the email template
  const filePath = path.join(__dirname, "../../template/userregistration.html");

  // Read the file synchronously (convert buffer to string)
  let emailHtml = fs.readFileSync(filePath, "utf-8");

  // Replace placeholders with actual values
  emailHtml = emailHtml
    .replace(/{{companyName}}/g, options.companyName)
    .replace(/{{userName}}/g, options.userName)
    .replace(/{{userEmail}}/g, options.userEmail)
    .replace(/{{userPhone}}/g, options.userPhone)
    .replace(/{{companyVenue}}/g, options.companyVenue)
    .replace(/{{loginUrl}}/g, options.loginUrl);

  return emailHtml;
};
export const sendRegistrationEmail = async (
  options: EmailOptions
): Promise<void> => {
    try {
    const emailHtml = getEmailTemplate(options);
    const mailOptions = {
      from: `${process.env.EMAIL_USER}`,
      to: options.to,
      subject: `Welcome to ${options.companyName}!`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent.");
  }
};
