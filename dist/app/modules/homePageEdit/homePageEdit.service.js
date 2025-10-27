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
exports.HomePageEditService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const homePageEdit_model_1 = require("./homePageEdit.model");
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const getHomePageData = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield homePageEdit_model_1.HomePageEditModel.findOne({});
    if (!data) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Home page data not found');
    }
    return data;
});
const updateHomePageData = (updateData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let existingData = yield homePageEdit_model_1.HomePageEditModel.findOne({});
    if (existingData) {
        // Unlink old images if new ones are uploaded
        if ((_a = updateData.image) === null || _a === void 0 ? void 0 : _a.length) {
            existingData.image.forEach(img => (0, unlinkFile_1.default)(img));
        }
        existingData.set(updateData);
        return yield existingData.save();
    }
    else {
        const newData = new homePageEdit_model_1.HomePageEditModel(updateData);
        return yield newData.save();
    }
});
exports.HomePageEditService = {
    getHomePageData,
    updateHomePageData,
};
