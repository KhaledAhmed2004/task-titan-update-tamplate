import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { HomePageEditModel } from './homePageEdit.model';
import { IHomePageEdit } from './homePageEdit.interface';
import unlinkFile from '../../../shared/unlinkFile';

const getHomePageData = async () => {
  const data = await HomePageEditModel.findOne({});
  if (!data) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Home page data not found');
  }
  return data;
};

const updateHomePageData = async (updateData: Partial<IHomePageEdit>) => {
  let existingData = await HomePageEditModel.findOne({});

  if (existingData) {
    // Unlink old images if new ones are uploaded
    if (updateData.image?.length) {
      existingData.image.forEach(img => unlinkFile(img));
    }

    existingData.set(updateData);
    return await existingData.save();
  } else {
    const newData = new HomePageEditModel(updateData);
    return await newData.save();
  }
};

export const HomePageEditService = {
  getHomePageData,
  updateHomePageData,
};
