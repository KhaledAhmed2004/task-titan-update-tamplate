import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from '../../../../config';
import { User } from '../../user/user.model';
import { USER_ROLES } from '../../../../enums/user';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id as string,
      clientSecret: config.google_client_secret as string,
      callbackURL: config.google_redirect_uri as string,
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          console.error('❌ Google profile missing email:', profile);
          return done(new Error('No email found in Google profile'));
        }

        // Frontend থেকে role নেওয়া
        const frontendRole = (req.query.role as USER_ROLES) || 'user';

        // ইউজার খুঁজে বের করা
        let user = await User.findOne({ email });

        // ইউজার আছে কি না চেক
        if (user) {
          // Blocked/Deleted check
          if (user.status === 'blocked' || user.status === 'deleted') {
            console.warn(`🚫 Blocked/Deleted user tried to login: ${email}`);
            return done(new Error('Account deactivated'));
          }

          // Google ID link করা না থাকলে link করা
          if (!user.googleId) {
            try {
              user.googleId = profile.id;
              await user.save();
              console.log(`🔗 Linked Google ID for existing user: ${email}`);
            } catch (err) {
              console.error('❌ Failed to link Google ID for existing user:', err);
              return done(new Error('Failed to link Google account'));
            }
          }

          return done(null, user);
        }

        // নতুন ইউজার তৈরি
        try {
          user = await User.create({
            name: profile.displayName,
            email,
            role: frontendRole,
            verified: true,
            googleId: profile.id,
          });
          console.log(`✅ New user created via Google: ${email}, role: ${frontendRole}`);
          return done(null, user);
        } catch (err) {
          console.error('❌ Failed to create new user:', err);
          return done(new Error('Failed to create new user'));
        }
      } catch (err) {
        console.error('❌ Google OAuth error:', err);
        return done(err);
      }
    }
  )
);

export default passport;
