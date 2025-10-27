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
exports.HomePageEditController = void 0;
const http_status_codes_1 = require("http-status-codes");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const homePageEdit_service_1 = require("./homePageEdit.service");
const getFilePath_1 = require("../../../shared/getFilePath");
// ======== READ ==============
const getHomePageData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield homePageEdit_service_1.HomePageEditService.getHomePageData();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Home page data retrieved successfully',
        data: result,
    });
}));
// ======== UPDATE ==============
const updateHomePageData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Handle multiple image uploads
    const images = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'image');
    const updateData = Object.assign(Object.assign({}, req.body), ((images === null || images === void 0 ? void 0 : images.length) ? { image: images } : {}));
    const result = yield homePageEdit_service_1.HomePageEditService.updateHomePageData(updateData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Home page data updated successfully',
        data: result,
    });
}));
exports.HomePageEditController = {
    getHomePageData,
    updateHomePageData,
};
