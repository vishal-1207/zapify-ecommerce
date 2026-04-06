import nodemailer from "nodemailer";

let developmentTransporter = null;

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
 * Uses Brevo REST API for production to avoid SMTP ETIMEDOUT issues on Render.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} html - The HTML body of the email.
 */
const sendMail = async (to, subject, html) => {
  try {
    if (process.env.BREVO_API_KEY) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            email: process.env.EMAIL_FROM || "noreply.zapify@gmail.com",
            name: "Zapify",
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Brevo API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
        );
      }

      const data = await response.json();
      console.log("Email sent successfully via Brevo API: ", data.messageId);
      return data;
    } else {
      const transporter = await getDevelopmentTransporter();

      const mailOptions = {
        from: `"Zapify" <${process.env.EMAIL_FROM || "noreply.zapify@gmail.com"}>`,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(
        "Email sent (Ethereal), preview URL: %s",
        nodemailer.getTestMessageUrl(info),
      );
      return info;
    }
  } catch (error) {
    console.error("Error sending mail: ", error.message);
    throw error;
  }
};

export default sendMail;

/**
 * Executes an email job asynchronously in the background.
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
