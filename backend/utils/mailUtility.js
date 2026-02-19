import nodemailer from "nodemailer";

/**
 * Creates a transporter for PRODUCTION using Brevo.
 * @private
 */
const createProductionTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Creates a transporter for DEVELOPMENT using Ethereal.
 * @private
 */
const createDevelopmentTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  console.log(
    "Ethereal test account created. Preview emails at:",
    nodemailer.getTestMessageUrl(testAccount)
  );

  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

/**
 * A generic, reusable function to send emails.
 * It automatically chooses the correct transporter based on the environment.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} html - The HTML body of the email.
 */

const sendMail = async (to, subject, html) => {
  try {
    let transporter;

    if (
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      // Use Production (Brevo/SMTP) if credentials are provided in .env
      transporter = createProductionTransporter();
    } else {
      // Fallback to Ethereal if no credentials
      transporter = await createDevelopmentTransporter();
    }

    if (!transporter || typeof transporter.sendMail !== "function") {
      throw new Error("Nodemailer transporter was not initialized correctly.");
    }

    const mailOptions = {
      from: `"Zapify" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production" && !process.env.EMAIL_HOST) {
      console.log(
        "Email sent (Ethereal), preview URL: %s",
        nodemailer.getTestMessageUrl(info)
      );
    } else {
      console.log("Email sent successfully: ", info.messageId);
    }

    return info;
  } catch (error) {
    console.error("Error sending mail: ", error);
  }
};

export default sendMail;
