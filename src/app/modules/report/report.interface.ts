import { Types } from 'mongoose';
import { IUser } from '../user/user.interface'; // assuming you have a user interface

// Enum for report status
export enum REPORT_STATUS {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

// Interface for creating a report
export interface ICreateReport {
  title: string;
  description: string;
  type: string;
  reportedBy: Types.ObjectId | IUser; // user who created the report
  relatedTo?: Types.ObjectId; // optional, e.g., related task, comment, post, etc.
}

// Interface for updating a report
export interface IUpdateReport {
  title?: string;
  description?: string;
  status?: REPORT_STATUS;
  type?: string;
  images?: string[];
}

// Interface for querying reports (filters & pagination)
export interface IQueryReports {
  status?: REPORT_STATUS;
  type?: string;
  reportedBy?: Types.ObjectId;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Full report interface (for DB model)
export interface IReport {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  images?: string[];
  type: string;
  status: REPORT_STATUS;
  reportedBy: Types.ObjectId | IUser;
  relatedTo?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
