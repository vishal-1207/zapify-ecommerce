import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "../templates");

// Register Handlebars Helpers
handlebars.registerHelper("formatCurrency", (value) => {
  if (typeof value !== "number") value = parseFloat(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
});

handlebars.registerHelper("formatDate", (value) => {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

/**
 * Renders a Handlebars template with an optional layout.
 * @param {string} templateName - Name of the template to render.
 * @param {object} context - Data to pass to the template.
 * @param {string|null} layoutName - Name of the layout to use, or null to skip layout.
 */
export const renderTemplate = async (
  templateName,
  context,
  layoutName = "layout",
) => {
  try {
    const templateSource = await fs.readFile(
      path.join(TEMPLATES_DIR, `${templateName}.hbs`),
      "utf-8",
    );
    const template = handlebars.compile(templateSource);
    const body = template(context);

    if (!layoutName) {
      return body;
    }

    const layoutSource = await fs.readFile(
      path.join(TEMPLATES_DIR, `${layoutName}.hbs`),
      "utf-8",
    );
    const layout = handlebars.compile(layoutSource);
    return layout({ ...context, body });
  } catch (error) {
    console.error(`Failed to render template ${templateName}:`, error);
    throw error;
  }
};

let developmentTransporter = null;

/**
 * Gets or creates a transporter for DEVELOPMENT using Ethereal.
 * @private
 */
const getDevelopmentTransporter = async () => {
  if (!developmentTransporter) {
    const testAccount = await nodemailer.createTestAccount();

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
 * Supports both raw HTML and Handlebars templates.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string|object} content - HTML string or { template, context } object.
 */
const sendMail = async (to, subject, content) => {
  try {
    let html = "";
    if (typeof content === "object" && content.template) {
      html = await renderTemplate(content.template, {
        ...content.context,
        frontendUrl: process.env.CLIENT_URL || "http://localhost:5173",
      });
    } else {
      html = content;
    }

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
 * @param {string|object} content - HTML string or { template, context } object.
 */
export const enqueueMail = async (to, subject, content) => {
  sendMail(to, subject, content).catch((err) => {
    console.error("Async background mail failed:", err.message);
  });
};
