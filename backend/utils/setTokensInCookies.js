const setTokensInCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });
};

export default setTokensInCookies;
