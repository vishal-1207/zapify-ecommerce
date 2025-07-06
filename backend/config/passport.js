import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/index.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOrCreate({
          where: { googleId: profile.id, providerId: profile.id },
          defaults: {
            email: profile.emails[0].value,
            username: profile.displayName,
            role: ["user"],
            provider: "google",
            providerId: profile.id,
          },
        });
        done(null, user[0]);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_OAUTH_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOrCreate({
          where: { githubId: profile.id, providerId: profile.id },
          defaults: {
            email: profile.emails[0].value,
            username: profile.username,
            role: ["user"],
            provider: "github",
            providerId: profile.id,
          },
        });
        done(null, user[0]);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

export default passport;
