const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const debug = require('../debug');

const User = require('../models/User');

function cookieExtractor(req) {
  let token = null;
  if (req && req.cookies) {
      token = req.cookies['refresh_token_hp'] + '.' + req.cookies['refresh_token_s'];
  }
  return token;
};

const accessJwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET
};

const refreshJwtOpts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.REFRESH_TOKEN_SECRET
};

module.exports = passport => {
  passport.use(
    'accessJWT',
    new JwtStrategy(accessJwtOpts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.userId);
        if (user) {
          debug.info('User is authenticated');
          return done(null, user);
        } else {
          debug.info('User is not authenticated');
          return done(null, false);
        }
      } catch(err){
        debug.error(err);
        return done(err, false);

      }
    })
  );

  passport.use(
    'refreshJWT',
    new JwtStrategy(refreshJwtOpts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.userId);
        if (user) {
          debug.info('Refresh token is valid');
          return done(null, user);
        } else {
          debug.info('Refresh token is invalid');
          return done(null, false);
        }
      } catch(err){
        debug.error(err);
        return done(err, false);
      }
    })
  )
}