import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';
import { HomePageEditService } from './homePageEdit.service';
import { getMultipleFilesPath } from '../../../shared/getFilePath';

// ======== READ ==============
const getHomePageData = catchAsync(async (req: Request, res: Response) => {
  const result = await HomePageEditService.getHomePageData();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Home page data retrieved successfully',
    data: result,
  });
});

// ======== UPDATE ==============
const updateHomePageData = catchAsync(async (req: Request, res: Response) => {
  // Handle multiple image uploads
  const images = getMultipleFilesPath(req.files, 'image');

  const updateData = {
    ...req.body,
    ...(images?.length ? { image: images } : {}),
  };

  const result = await HomePageEditService.updateHomePageData(updateData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Home page data updated successfully',
    data: result,
  });
});

export const HomePageEditController = {
  getHomePageData,
  updateHomePageData,
};
