import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: '/api/auth/google/callback',
});

const getGoogleAuthUrl = () => {
  const authUrl = client.generateAuthUrl({
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
  return authUrl;
};

const verifyGoogleToken = async (code) => {
  try {
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    logger.info(`Google token verified for email: ${payload.email}`);
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    logger.error(`Google OAuth error: ${error.message}`);
    throw error;
  }
};

export { getGoogleAuthUrl, verifyGoogleToken };