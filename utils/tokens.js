const jwt = require('jsonwebtoken');

const splitToken = (token) => {
  const [header, payload, signature] = token.split(".");

  const refreshTokenHP = header + '.' + payload;
  const refreshTokenS = signature;

  return [refreshTokenHP, refreshTokenS];
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {userId: user._id, nickname: user.nickname},
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
}

const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = jwt.sign(
    {userId: user._id},
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  );

  const [refreshTokenHP, refreshTokenS] = splitToken(refreshToken);

  return { accessToken, refreshTokenHP, refreshTokenS };
}

const refreshTokenOptsHTTPOnly = {
  httpOnly: true, //JS has no access to the cookie on the client
  secure: true, // https: scheme only except for localhost
  maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day until cookie expires
  sameSite: 'Strict', // the browser sends the cookie only for same-site requests, that is, requests originating from the same site that set the cookie.
  path: '/auth' // must exist in the request url for the browser to send cookie
};

const refreshTokenOptsNotHTTP = {
  secure: true, // https: scheme only except for localhost
  maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day until cookie expires
  sameSite: 'Strict', // the browser sends the cookie only for same-site requests, that is, requests originating from the same site that set the cookie.
  path: '/auth' // must exist in the request url for the browser to send cookie
};

module.exports = { 
  generateAccessToken,
  generateTokens,
  refreshTokenOptsHTTPOnly,
  refreshTokenOptsNotHTTP
 }