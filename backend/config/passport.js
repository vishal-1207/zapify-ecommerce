import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/index.js";
import { generateUniqueName } from "../utils/passport.util.js";

//Google Passport Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const generatedUsername = await generateUniqueName();
        const user = await User.findOrCreate({
          where: { provider: "google", providerId: profile.id },
          defaults: {
            fullname: profile.displayName,
            username: generatedUsername,
            email: profile.emails[0].value,
            roles: ["user"],
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

//Github Passport Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_OAUTH_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const generatedUsername = generateUniqueName();
        const user = await User.findOrCreate({
          where: { provider: "github", providerId: profile.id },
          defaults: {
            fullname: profile.displayName,
            username: generatedUsername,
            email: profile.emails[0].value,
            roles: ["user"],
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
