import ms from "ms";

/**
 * Sets access and refresh token cookies on the response.
 * @param {object} res - Express response object
 * @param {object} tokens - { accessToken, refreshToken }
 * @param {object} options - Base cookie options (httpOnly, secure, sameSite, path)
 * @param {number} [refreshMaxAge] - Optional override for refresh cookie maxAge (ms).
 *   Pass this when re-issuing the access token only, so the refresh cookie reflects
 *   the remaining TTL of the stored token rather than the full duration.
 */
const setTokensInCookies = (
  res,
  { accessToken, refreshToken },
  options,
  refreshMaxAge,
) => {
  const accessMaxAge = ms(process.env.ACCESS_TOKEN_EXPIRY || "15m");
  const finalRefreshMaxAge =
    refreshMaxAge ?? ms(process.env.REFRESH_TOKEN_EXPIRY || "10d");

  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: accessMaxAge,
  });

  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: finalRefreshMaxAge,
    });
  }
};

export default setTokensInCookies;
