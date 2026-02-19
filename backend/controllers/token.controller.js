import { generateCSRF } from "../utils/csrf.utils.js";
import asyncHandler from "../utils/asyncHandler.js";

export const csrfToken = asyncHandler(async (req, res) => {
  try {
    const { secret, token } = await generateCSRF();

    if (!secret || !token) {
      throw new Error("Failed to generate CSRF token.");
    }

    res.cookie("csrf_secret", secret, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    // Set XSRF-TOKEN for frontend to read and send back in header
    // Must be httpOnly: false so JavaScript can read it
    res.cookie("XSRF-TOKEN", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    return res.status(200).json({ csrfToken: token });
  } catch (err) {
    console.error("CSRF token generation failed: ", err.message);
    return res.status(500).json({
      message: "Failed to generate CSRF token.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});
