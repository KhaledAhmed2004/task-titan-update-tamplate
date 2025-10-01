"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomePageEditModel = void 0;
const mongoose_1 = require("mongoose");
const homePageEditSchema = new mongoose_1.Schema({
    subHeader: { type: String, trim: true },
    header: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    rating: { type: String, trim: true },
    responseTime: { type: String, required: true, trim: true },
    image: [{ type: String, trim: true }], // Multiple images
    activeUser: { type: String, required: true, trim: true },
    paidToTitans: { type: String, required: true, trim: true },
    successRate: { type: String, required: true, trim: true },
    userRating: { type: String, required: true, trim: true },
    // How It Works Section
    howItWorksHeading1: { type: String, trim: true },
    howItWorksSubheading1: { type: String, trim: true },
    howItWorksIcon1: { type: String, trim: true },
    howItWorksHeading2: { type: String, trim: true },
    howItWorksSubheading2: { type: String, trim: true },
    howItWorksIcon2: { type: String, trim: true },
    howItWorksHeading3: { type: String, trim: true },
    howItWorksSubheading3: { type: String, trim: true },
    howItWorksIcon3: { type: String, trim: true },
    // Why Choose Us Section
    whyChooseUsHeading1: { type: String, trim: true },
    whyChooseUsSubheading1: { type: String, trim: true },
    whyChooseUsIcon1: { type: String, trim: true },
    whyChooseUsHeading2: { type: String, trim: true },
    whyChooseUsSubheading2: { type: String, trim: true },
    whyChooseUsIcon2: { type: String, trim: true },
    whyChooseUsHeading3: { type: String, trim: true },
    whyChooseUsSubheading3: { type: String, trim: true },
    whyChooseUsIcon3: { type: String, trim: true },
    whyChooseUsHeading4: { type: String, trim: true },
    whyChooseUsSubheading4: { type: String, trim: true },
    whyChooseUsIcon4: { type: String, trim: true },
}, { timestamps: true });
exports.HomePageEditModel = (0, mongoose_1.model)('HomePageEdit', homePageEditSchema);
