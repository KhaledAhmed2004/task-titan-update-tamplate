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
exports.User = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const config_1 = __importDefault(require("../../../config"));
const user_1 = require("../../../enums/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: Object.values(user_1.USER_ROLES),
        default: user_1.USER_ROLES.POSTER,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: function () {
            // Password is not required for OAuth users (users with googleId)
            return !this.googleId;
        },
        minlength: 8,
        select: false, // hide password by default
    },
    location: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    dateOfBirth: {
        type: String,
    },
    phone: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    status: {
        type: String,
        enum: Object.values(user_1.USER_STATUS),
        default: user_1.USER_STATUS.ACTIVE,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    deviceTokens: {
        type: [String],
        default: [],
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    ratingsCount: {
        type: Number,
        default: 0,
    },
    about: {
        type: String,
    },
    googleId: {
        type: String,
        sparse: true, // allows multiple null values but unique non-null values
    },
    achievements: {
        type: [String],
        default: [],
    },
    authentication: {
        type: {
            isResetPassword: {
                type: Boolean,
                default: false,
            },
            oneTimeCode: {
                type: Number,
                default: null,
            },
            expireAt: {
                type: Date,
                default: null,
            },
        },
        select: false, // hide auth info by default
    },
}, { timestamps: true });
//exist user check
userSchema.statics.isExistUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield exports.User.findById(id);
    return isExist;
});
userSchema.statics.isExistUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield exports.User.findOne({ email });
    return isExist;
});
//is match password
userSchema.statics.isMatchPassword = (password, hashPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.compare(password, hashPassword);
});
//check user
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        //check user - exclude current user from email uniqueness check
        const isExist = yield exports.User.findOne({
            email: this.email,
            _id: { $ne: this._id } // exclude current user
        });
        if (isExist) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Email already exist!');
        }
        //password hash - only hash if password is provided (not for OAuth users)
        if (this.password) {
            this.password = yield bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
        }
        next();
    });
});
// ✅ add device token
userSchema.statics.addDeviceToken = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    return yield exports.User.findByIdAndUpdate(userId, { $addToSet: { deviceTokens: token } }, // prevent duplicates
    { new: true });
});
// ✅ remove device token
userSchema.statics.removeDeviceToken = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    return yield exports.User.findByIdAndUpdate(userId, { $pull: { deviceTokens: token } }, { new: true });
});
exports.User = (0, mongoose_1.model)('User', userSchema);
