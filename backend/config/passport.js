import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import db from "../models/index.js";
import { generateUniqueName } from "../utils/passport.util.js";

const initializePassport = () => {
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
        const generatedUsername = await generateUniqueName(profile.displayName);
        // Check if user exists by email
        const existingUser = await db.User.findOne({
          where: { email: profile.emails[0].value },
        });

        if (existingUser) {
          if (existingUser.provider !== "google") {
            return done(null, false, {
              message: `Account already exists with ${existingUser.provider}. Please login with ${existingUser.provider}.`,
            });
          }
          // Same provider, log them in
          return done(null, existingUser);
        }

        const user = await db.User.create({
          fullname: profile.displayName,
          username: generatedUsername,
          email: profile.emails[0].value,
          password: "",
          roles: ["user"],
          provider: "google",
          providerId: profile.id,
        });
        done(null, user);
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
        const generatedUsername = await generateUniqueName(
          profile.displayName || profile.username || "github-user"
        );
        const email =
          profile.emails && profile.emails[0]
            ? profile.emails[0].value
            : `${generatedUsername}@github.placeholder.com`;

        // Check if user exists by email
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
          if (existingUser.provider !== "github") {
            return done(null, false, {
              message: `Account already exists with ${existingUser.provider}. Please login with ${existingUser.provider}.`,
            });
          }
          return done(null, existingUser);
        }

        const user = await db.User.create({
          fullname: profile.displayName || profile.username || "Github User",
          username: generatedUsername,
          email: email,
          password: "",
          roles: ["user"],
          provider: "github",
          providerId: profile.id,
        });
        done(null, user);
      } catch (err) {
        if (err.name === "SequelizeValidationError") {
          console.error("Sequelize Validation Error:", err.errors);
        } else {
          console.error("GitHub Auth Error:", err);
        }
        done(err, null);
      }
    }
  )
);
}

export default initializePassport;
