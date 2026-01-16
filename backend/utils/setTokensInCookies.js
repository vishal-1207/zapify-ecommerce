const setTokensInCookies = (res, { accessToken, refreshToken }, options) => {
  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });
};

export default setTokensInCookies;
