import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth setup
  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientID || !googleClientSecret) {
    console.error("WARNING: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Google authentication will not work.");
  }

  if (googleClientID && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientID,
          clientSecret: googleClientSecret,
          callbackURL: "/api/auth/google/callback",
          scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const firstName = profile.name?.givenName;
            const lastName = profile.name?.familyName;
            const profileImageUrl = profile.photos?.[0]?.value;

            const googleUserId = `google:${profile.id}`;

            const user = await storage.upsertUser({
              id: googleUserId,
              email: email || null,
              firstName: firstName || null,
              lastName: lastName || null,
              profileImageUrl: profileImageUrl || null,
            });

            return done(null, { id: user.id });
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  // Microsoft OAuth setup
  const msClientID = process.env.MICROSOFT_CLIENT_ID;
  const msClientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!msClientID || !msClientSecret) {
    console.error("WARNING: Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET. Microsoft authentication will not work.");
  }

  if (msClientID && msClientSecret) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: msClientID,
          clientSecret: msClientSecret,
          callbackURL: "/auth/microsoft/callback",
          scope: ["user.read"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
            const firstName = profile.name?.givenName || profile._json?.givenName;
            const lastName = profile.name?.familyName || profile._json?.surname;
            const displayName = profile.displayName || profile._json?.displayName;

            const microsoftUserId = `microsoft:${profile.id}`;

            const user = await storage.upsertUser({
              id: microsoftUserId,
              email: email || null,
              firstName: firstName || displayName?.split(' ')[0] || null,
              lastName: lastName || displayName?.split(' ').slice(1).join(' ') || null,
              profileImageUrl: null,
            });

            return done(null, { id: user.id });
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  // Serialize only the user ID to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize by fetching the full user from the database
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google auth routes
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    } as any)
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=auth_failed",
    }),
    (req, res) => {
      res.redirect("/dashboard");
    }
  );

  // Microsoft auth routes
  app.get(
    "/auth/microsoft",
    passport.authenticate("microsoft", {
      prompt: "select_account",
    } as any)
  );

  app.get(
    "/auth/microsoft/callback",
    passport.authenticate("microsoft", {
      failureRedirect: "/login?error=auth_failed",
    }),
    (req, res) => {
      res.redirect("/dashboard");
    }
  );

  // Development-only bypass login (creates a test user session)
  if (process.env.NODE_ENV !== "production") {
    app.get("/auth/dev", async (req, res) => {
      try {
        const devUser = await storage.upsertUser({
          id: "dev:test-user",
          email: "dev@flowlift.local",
          firstName: "Dev",
          lastName: "User",
          profileImageUrl: null,
        });

        req.login({ id: devUser.id }, (err) => {
          if (err) {
            console.error("Dev login error:", err);
            return res.redirect("/login?error=dev_auth_failed");
          }
          res.redirect("/dashboard");
        });
      } catch (error) {
        console.error("Dev login error:", error);
        res.redirect("/login?error=dev_auth_failed");
      }
    });
  }

  // Legacy login redirect - now goes to login page
  app.get("/api/login", (req, res) => {
    res.redirect("/login");
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json(req.user);
  });
}

// Keep the old export name for backwards compatibility
export const setupGoogleAuth = setupAuth;

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  (req as any).user = {
    ...user,
    claims: {
      sub: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.profileImageUrl,
    },
  };

  return next();
};
