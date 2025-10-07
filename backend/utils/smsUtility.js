import ApiError from "./ApiError.js";

const BREVO_API_URL = "https://api.brevo.com/v3/transactionalSMS/send";
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_NAME = process.env.SMS_SENDER_NAME;

/**
 * A generic, reusable function to send SMS messages using Brevo's API.
 * @param {string} to - The recipient's phone number in E.164 format (e.g., +919876543210).
 * @param {string} content - The text message to send.
 */
const sendSms = async (to, content) => {
  try {
    if (!to || !content) {
      throw new ApiError(
        400,
        "Recipient phone number and message content are required."
      );
    }

    if (!BREVO_API_KEY || SENDER_NAME) {
      console.error(
        "Brevo API Key or sender name is not configured in .env file."
      );
      return;
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: SENDER_NAME,
        recipient: to,
        content: content,
        type: "transactional",
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error(
        "Failed to send SMS via Brevo: ",
        data.message || "Unknown error."
      );
      return;
    }
  } catch (error) {
    console.error("Error in sendSms utility: ", error);
  }
};

export default sendSms;
