"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomePageEditValidation = void 0;
const zod_1 = require("zod");
const updateHomePageDataZodSchema = zod_1.z.object({
    subHeader: zod_1.z.string().optional(),
    header: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    rating: zod_1.z.string().optional(),
    responseTime: zod_1.z.string().optional(),
    image: zod_1.z.array(zod_1.z.string()).optional(),
    activeUser: zod_1.z.string().optional(),
    paidToTitans: zod_1.z.string().optional(),
    successRate: zod_1.z.string().optional(),
    userRating: zod_1.z.string().optional(),
    // How It Works Section
    howItWorksHeading1: zod_1.z.string().optional(),
    howItWorksSubheading1: zod_1.z.string().optional(),
    howItWorksIcon1: zod_1.z.string().optional(),
    howItWorksHeading2: zod_1.z.string().optional(),
    howItWorksSubheading2: zod_1.z.string().optional(),
    howItWorksIcon2: zod_1.z.string().optional(),
    howItWorksHeading3: zod_1.z.string().optional(),
    howItWorksSubheading3: zod_1.z.string().optional(),
    howItWorksIcon3: zod_1.z.string().optional(),
    // Why Choose Us Section
    whyChooseUsHeading1: zod_1.z.string().optional(),
    whyChooseUsSubheading1: zod_1.z.string().optional(),
    whyChooseUsIcon1: zod_1.z.string().optional(),
    whyChooseUsHeading2: zod_1.z.string().optional(),
    whyChooseUsSubheading2: zod_1.z.string().optional(),
    whyChooseUsIcon2: zod_1.z.string().optional(),
    whyChooseUsHeading3: zod_1.z.string().optional(),
    whyChooseUsSubheading3: zod_1.z.string().optional(),
    whyChooseUsIcon3: zod_1.z.string().optional(),
    whyChooseUsHeading4: zod_1.z.string().optional(),
    whyChooseUsSubheading4: zod_1.z.string().optional(),
    whyChooseUsIcon4: zod_1.z.string().optional(),
});
exports.HomePageEditValidation = {
    updateHomePageDataZodSchema,
};
