"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const index_1 = __importDefault(require("./index"));
const user_model_1 = require("../app/modules/user/user.model");
const user_1 = require("../enums/user");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: index_1.default.google_client_id,
    clientSecret: index_1.default.google_client_secret,
    callbackURL: index_1.default.google_redirect_uri,
    passReqToCallback: true, // ✅ allow req access
}, (req, _accessToken, _refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            console.error('No email found in Google profile');
            return done(new Error('No email found in Google profile'), undefined);
        }
        // ✅ get role from state parameter (OAuth callback)
        let roleFromFrontend = user_1.USER_ROLES.POSTER; // default
        try {
            if (req.query.state) {
                const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
                const parsedRole = stateData.role;
                // Validate that the role is a valid USER_ROLES value
                if (parsedRole &&
                    Object.values(user_1.USER_ROLES).includes(parsedRole)) {
                    roleFromFrontend = parsedRole;
                }
            }
        }
        catch (error) {
            console.log('Could not parse state parameter, using default role');
        }
        console.log('Role from frontend:', roleFromFrontend);
        let user = yield user_model_1.User.findOne({ email });
        if (!user) {
            try {
                // Create new user with role from frontend
                user = yield user_model_1.User.create({
                    name: profile.displayName || 'Google User',
                    email,
                    verified: true,
                    googleId: profile.id,
                    role: roleFromFrontend, // ✅ assign role here
                    location: '',
                    gender: 'male',
                    dateOfBirth: '',
                    phone: '',
                });
            }
            catch (createError) {
                return done(createError, undefined);
            }
        }
        else if (!user.googleId) {
            user.googleId = profile.id;
            user.verified = true;
            user.role = roleFromFrontend; // ✅ update role when linking account
            yield user.save();
        }
        else {
            // ✅ Update role for existing Google users if different
            if (user.role !== roleFromFrontend) {
                user.role = roleFromFrontend;
                yield user.save();
            }
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
})));
exports.default = passport_1.default;
