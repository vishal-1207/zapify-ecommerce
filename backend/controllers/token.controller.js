import generateCSRF from "../utils/csrf.utils.js";

export const csrfToken = async (req, res) => {
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

    res.cookie("csrf_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ csrfToken: token });
  } catch (err) {
    console.error("CSRF token generation failed: ", err.message);
    res.status(500).json({
      message: "Failed to generate CSRF token.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
