import nodemailer from "nodemailer";

let productionTransporter = null;
let developmentTransporter = null;

/**
 * Gets or creates a transporter for PRODUCTION using Brevo.
 * @private
 */
const getProductionTransporter = () => {
  if (!productionTransporter) {
    productionTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 60000,
      socketTimeout: 60000,
      tls: { rejectUnauthorized: false },
    });
  }
  return productionTransporter;
};

/**
 * Gets or creates a transporter for DEVELOPMENT using Ethereal.
 * @private
 */
const getDevelopmentTransporter = async () => {
  if (!developmentTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    console.log(
      "Ethereal test account created. Preview emails at:",
      nodemailer.getTestMessageUrl(testAccount),
    );

    developmentTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      pool: true,
    });
  }
  return developmentTransporter;
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
      transporter = getProductionTransporter();
    } else {
      transporter = await getDevelopmentTransporter();
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
        nodemailer.getTestMessageUrl(info),
      );
    } else {
      console.log("Email sent successfully: ", info.messageId);
    }

    return info;
  } catch (error) {
    console.error("Error sending mail: ", error);
    throw error;
  }
};

export default sendMail;

/**
 * Executes an email job asynchronously in the background.
 * Replaces the previous BullMQ implementation.
 *
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML body.
 */
export const enqueueMail = async (to, subject, html) => {
  sendMail(to, subject, html).catch((err) => {
    console.error("Async background mail failed:", err.message);
  });
};
