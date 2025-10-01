import { Schema, model } from 'mongoose';
import { IReport, REPORT_STATUS } from './report.interface';

const reportSchema = new Schema<IReport>(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
    },
    type: {
      type: String,
      required: [true, 'Report type is required'],
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    relatedTo: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create the model
export const Report = model<IReport>('Report', reportSchema);
