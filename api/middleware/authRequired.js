/*
 * This is an example of using middleware to secure routers.
 */
const Profiles = require('../profile/profileService');
const createError = require('http-errors');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const oktaVerifierConfig = require('../../config/okta');
const oktaJwtVerifier = new OktaJwtVerifier(oktaVerifierConfig.config);

const makeProfileObj = (claims) => {
  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
  };
};
/**
 * A simple middleware that asserts valid idToken JWT and sends 401 responses
 * if the token is not present or fails validation. If the token is valid its
 * contents are attached to req.profile
 */
const authRequired = (role) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer (.+)/);

    if (!match) throw new Error('Missing idToken');

    const idToken = match[1];
    oktaJwtVerifier
      .verifyAccessToken(idToken, oktaVerifierConfig.expectedAudience)
      .then(async (data) => {
        const { email } = makeProfileObj(data.claims);
        const profile = await Profiles.findByEmail(email);
        if (profile && (!role || profile.type === role)) {
          req.profile = profile;
        } else {
          throw new Error('Unable to process idToken');
        }
        next();
      });
  } catch (err) {
    next(createError(401, err.message));
  }
};

module.exports = authRequired;
