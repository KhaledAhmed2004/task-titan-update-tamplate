import mongoose from 'mongoose';

export interface IRating extends Document {
  taskId: mongoose.Types.ObjectId;
  givenBy: mongoose.Types.ObjectId;
  givenTo: mongoose.Types.ObjectId;
  rating: number;
  message?: string;
}
