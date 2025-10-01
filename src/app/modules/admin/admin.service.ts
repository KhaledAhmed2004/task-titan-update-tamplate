import ApiError from '../../../errors/ApiError';
import { PaymentModel } from '../payment/payment.model';
import { User } from '../user/user.model';
import { TaskModel } from '../task/task.model';
import httpStatus from 'http-status';
import { IDashboardStats } from './admin.interface';
import AggregationBuilder, {
  calculateGrowthDynamic,
} from '../../builder/AggregationBuilder';
import { Report } from '../report/report.model';

const getDashboardStats = async (): Promise<IDashboardStats> => {
  try {
    // 1st step: Validate models exist
    if (!User || !TaskModel || !PaymentModel || !Report) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Required models are not available'
      );
    }

    // 2nd step: Use dynamic growth calculation for different models
    const [allUsersStats, postsStats, revenueStats, reportStats] =
      await Promise.all([
        calculateGrowthDynamic(User, { period: 'month' }),
        calculateGrowthDynamic(TaskModel, { period: 'month' }),
        calculateGrowthDynamic(PaymentModel, {
          period: 'month',
          sumField: 'platformFee',
        }),
        calculateGrowthDynamic(Report, { period: 'month' }),
      ]);

    // 3rd step: Pick only total, formattedGrowth & growthType
    const pickStats = (stats: any) => ({
      total: stats.total,
      formattedGrowth: stats.formattedGrowth,
      growthType: stats.growthType,
    });

    return {
      allUsers: pickStats(allUsersStats),
      posts: pickStats(postsStats),
      revenue: pickStats(revenueStats),
      reports: pickStats(reportStats),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to fetch dashboard statistics: ${errorMessage}`
    );
  }
};

const getMonthlyRevenue = async () => {
  const aggregationBuilder = new AggregationBuilder(PaymentModel);

  // Monthly revenue
  const monthlyRevenue = await aggregationBuilder.getTimeTrends({
    sumField: 'platformFee',
    timeUnit: 'month',
  });

  return monthlyRevenue;
};

export const DashboardService = {
  getDashboardStats,
  getMonthlyRevenue,
};
