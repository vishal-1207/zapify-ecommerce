import Tokens from "csrf";

const tokens = new Tokens();

export const generateCSRF = async () => {
  const secret = await tokens.secret();
  const token = tokens.create(secret);
  return { secret, token };
};

export const verifyCSRF = (secret, token) => {
  return tokens.verify(secret, token);
};
