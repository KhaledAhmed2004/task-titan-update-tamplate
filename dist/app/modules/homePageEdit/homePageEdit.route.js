"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomePageEditRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const homePageEdit_controller_1 = require("./homePageEdit.controller");
const homePageEdit_validation_1 = require("./homePageEdit.validation");
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const router = (0, express_1.Router)();
// ======== READ ==========
router.get('/', homePageEdit_controller_1.HomePageEditController.getHomePageData);
// ======== UPDATE ==========
router.patch('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), // Only Super Admin
(0, fileUploadHandler_1.default)(), // Handle image upload
(req, res, next) => {
    if (req.body.data) {
        req.body = homePageEdit_validation_1.HomePageEditValidation.updateHomePageDataZodSchema.parse(JSON.parse(req.body.data));
    }
    return homePageEdit_controller_1.HomePageEditController.updateHomePageData(req, res, next);
});
exports.HomePageEditRoutes = router;
