import { Model, PipelineStage } from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';

interface IGrowthOptions {
  sumField?: string; // Field to sum for revenue calculations
  filter?: Record<string, any>; // Additional filters
  groupBy?: string; // Field to group by (optional)
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year'; // Growth period
}

interface IStatistic {
  total: number;
  thisPeriodCount: number;
  lastPeriodCount: number;
  growth: number;
  formattedGrowth: string;
  growthType: 'increase' | 'decrease' | 'no_change';
}

class AggregationBuilder<T> {
  private model: Model<T>;
  private pipeline: PipelineStage[] = [];

  constructor(model: Model<T>) {
    this.model = model;
  }

  // ====== PIPELINE BUILDERS ======
  match(conditions: Record<string, any>) {
    this.pipeline.push({ $match: conditions });
    return this;
  }

  group(groupSpec: Record<string, any>) {
    this.pipeline.push({ $group: groupSpec });
    return this;
  }

  project(projectSpec: Record<string, any>) {
    this.pipeline.push({ $project: projectSpec });
    return this;
  }

  sort(sortSpec: Record<string, any>) {
    this.pipeline.push({ $sort: sortSpec });
    return this;
  }

  limit(limitValue: number) {
    this.pipeline.push({ $limit: limitValue });
    return this;
  }

  reset() {
    this.pipeline = [];
    return this;
  }

  getPipeline() {
    return this.pipeline;
  }

  async execute(): Promise<any[]> {
    return await this.model.aggregate(this.pipeline);
  }

  // ====== PERIOD CALCULATOR ======
  private getPeriodDates(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ) {
    const now = new Date();
    let startThis: Date, startLast: Date, endLast: Date;

    switch (period) {
      case 'day':
        startThis = new Date(now);
        startThis.setHours(0, 0, 0, 0);

        startLast = new Date(startThis);
        startLast.setDate(startThis.getDate() - 1);

        endLast = new Date(startThis);
        endLast.setDate(startThis.getDate() - 1);
        endLast.setHours(23, 59, 59, 999);
        break;

      case 'week':
        const day = now.getDay(); // Sunday = 0
        startThis = new Date(now);
        startThis.setDate(now.getDate() - day);
        startThis.setHours(0, 0, 0, 0);

        startLast = new Date(startThis);
        startLast.setDate(startThis.getDate() - 7);

        endLast = new Date(startThis);
        endLast.setDate(startThis.getDate() - 1);
        endLast.setHours(23, 59, 59, 999);
        break;

      case 'month':
        startThis = new Date(now.getFullYear(), now.getMonth(), 1);
        startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endLast = new Date(now.getFullYear(), now.getMonth(), 0);
        endLast.setHours(23, 59, 59, 999);
        break;

      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startThis = new Date(now.getFullYear(), currentQuarter * 3, 1);

        const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const lastQuarterYear =
          currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startLast = new Date(lastQuarterYear, lastQuarter * 3, 1);
        endLast = new Date(lastQuarterYear, (lastQuarter + 1) * 3, 0);
        endLast.setHours(23, 59, 59, 999);
        break;

      case 'year':
        startThis = new Date(now.getFullYear(), 0, 1);
        startLast = new Date(now.getFullYear() - 1, 0, 1);
        endLast = new Date(now.getFullYear() - 1, 11, 31);
        endLast.setHours(23, 59, 59, 999);
        break;

      default:
        throw new Error('Unsupported period');
    }

    return { startThis, startLast, endLast };
  }

  // ====== GENERIC GROWTH CALCULATION ======
  async calculateGrowth(options: IGrowthOptions = {}): Promise<IStatistic> {
    try {
      const { sumField, filter = {}, groupBy, period = 'month' } = options;
      const { startThis, startLast, endLast } = this.getPeriodDates(period);

      const buildPipeline = (dateFilter?: Record<string, any>) => {
        const pipeline: PipelineStage[] = [];
        const matchConditions = { ...filter };
        if (dateFilter) matchConditions.createdAt = dateFilter;

        pipeline.push({ $match: matchConditions });

        const groupSpec: Record<string, any> = {
          _id: groupBy ? `$${groupBy}` : null,
        };
        groupSpec.total = sumField ? { $sum: `$${sumField}` } : { $sum: 1 };
        pipeline.push({ $group: groupSpec });

        if (groupBy) {
          pipeline.push({ $group: { _id: null, total: { $sum: '$total' } } });
        }

        return pipeline;
      };

      const [thisPeriodResult, lastPeriodResult, totalResult] =
        await Promise.all([
          this.model.aggregate(buildPipeline({ $gte: startThis })),
          this.model.aggregate(
            buildPipeline({ $gte: startLast, $lte: endLast })
          ),
          this.model.aggregate(buildPipeline()),
        ]);

      const thisPeriodCount = thisPeriodResult[0]?.total || 0;
      const lastPeriodCount = lastPeriodResult[0]?.total || 0;
      const total = totalResult[0]?.total || 0;

      // Growth calculation
      let growth = 0;
      let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

      if (lastPeriodCount > 0) {
        growth = ((thisPeriodCount - lastPeriodCount) / lastPeriodCount) * 100;
        growthType =
          growth > 0 ? 'increase' : growth < 0 ? 'decrease' : 'no_change';
      } else if (thisPeriodCount > 0 && lastPeriodCount === 0) {
        growth = 100;
        growthType = 'increase';
      }

      const formattedGrowth = (growth > 0 ? '+' : '') + growth.toFixed(2) + '%';

      return {
        total,
        thisPeriodCount,
        lastPeriodCount,
        growth: Math.abs(growth),
        formattedGrowth,
        growthType,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to calculate growth: ${errorMessage}`
      );
    }
  }

  // ====== REVENUE BREAKDOWN ======
  async getRevenueBreakdown(options: {
    sumField: string;
    groupByField: string;
    filter?: Record<string, any>;
    limit?: number;
  }) {
    const { sumField, groupByField, filter = {}, limit = 10 } = options;

    this.pipeline = [
      { $match: filter },
      {
        $group: {
          _id: `$${groupByField}`,
          totalRevenue: { $sum: `$${sumField}` },
          count: { $sum: 1 },
          averageRevenue: { $avg: `$${sumField}` },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          [groupByField]: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          count: 1,
          averageRevenue: { $round: ['$averageRevenue', 2] },
        },
      },
    ];

    return await this.execute();
  }

  // ====== TIME TRENDS ======
  // async getTimeTrends(options: {
  //   sumField?: string;
  //   timeUnit: 'day' | 'week' | 'month' | 'year';
  //   filter?: Record<string, any>;
  //   limit?: number;
  // }) {
  //   const { sumField, timeUnit, filter = {}, limit = 12 } = options;

  //   const dateGrouping = {
  //     day: {
  //       year: { $year: '$createdAt' },
  //       month: { $month: '$createdAt' },
  //       day: { $dayOfMonth: '$createdAt' },
  //     },
  //     week: { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } },
  //     month: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
  //     year: { year: { $year: '$createdAt' } },
  //   };

  //   this.pipeline = [
  //     { $match: filter },
  //     {
  //       $group: {
  //         _id: dateGrouping[timeUnit],
  //         total: sumField ? { $sum: `$${sumField}` } : { $sum: 1 },
  //         count: { $sum: 1 },
  //       },
  //     },
  //     {
  //       $sort: {
  //         '_id.year': -1,
  //         '_id.month': -1,
  //         '_id.week': -1,
  //         '_id.day': -1,
  //       },
  //     },
  //     { $limit: limit },
  //   ];

  //   return await this.execute();
  // }

  async getTimeTrends(options: {
    sumField?: string;
    timeUnit: 'day' | 'week' | 'month' | 'year';
    filter?: Record<string, any>;
    limit?: number;
  }) {
    const { sumField, timeUnit, filter = {}, limit } = options;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Only consider documents from the current year
    const yearFilter = {
      ...filter,
      createdAt: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31),
      },
    };

    const dateGrouping = {
      day: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      },
      week: { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } },
      month: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      year: { year: { $year: '$createdAt' } },
    };

    this.pipeline = [
      { $match: yearFilter },
      {
        $group: {
          _id: dateGrouping[timeUnit],
          total: sumField ? { $sum: `$${sumField}` } : { $sum: 1 },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1,
          '_id.week': -1,
          '_id.day': -1,
        },
      },
    ];

    const results = await this.execute();

    switch (timeUnit) {
      case 'month': {
        const months = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total: 0,
          count: 0,
        }));
        results.forEach(item => {
          const index = item._id.month - 1;
          months[index] = {
            month: item._id.month,
            total: item.total,
            count: item.count,
          };
        });

        return months.map(m => ({
          label: new Date(currentYear, m.month - 1).toLocaleString('default', {
            month: 'short',
          }),
          totalRevenue: m.total,
          transactionCount: m.count,
        }));
      }

      case 'week': {
        const weeks = Array.from({ length: 52 }, (_, i) => ({
          week: i + 1,
          total: 0,
          count: 0,
        }));
        results.forEach(item => {
          if (item._id.year === currentYear) {
            const index = item._id.week - 1;
            weeks[index] = {
              week: item._id.week,
              total: item.total,
              count: item.count,
            };
          }
        });

        return weeks.map(w => ({
          label: `Week ${w.week}`,
          totalRevenue: w.total,
          transactionCount: w.count,
        }));
      }

      case 'day': {
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          total: 0,
          count: 0,
        }));
        results.forEach(item => {
          if (
            item._id.year === currentYear &&
            item._id.month === currentMonth + 1
          ) {
            const index = item._id.day - 1;
            days[index] = {
              day: item._id.day,
              total: item.total,
              count: item.count,
            };
          }
        });

        return days.map(d => ({
          label: `${now.toLocaleString('default', { month: 'short' })} ${
            d.day
          }`,
          totalRevenue: d.total,
          transactionCount: d.count,
        }));
      }

      case 'year': {
        const years = Array.from({ length: 5 }, (_, i) => ({
          year: currentYear - i,
          total: 0,
          count: 0,
        }));

        results.forEach(item => {
          const index = years.findIndex(y => y.year === item._id.year);
          if (index >= 0) {
            years[index] = {
              year: item._id.year,
              total: item.total,
              count: item.count,
            };
          }
        });

        return years.map(y => ({
          label: `${y.year}`,
          totalRevenue: y.total,
          transactionCount: y.count,
        }));
      }

      default:
        return results;
    }
  }

  // ====== TOP PERFORMERS ======
  async getTopPerformers(options: {
    sumField: string;
    groupByField: string;
    filter?: Record<string, any>;
    limit?: number;
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  }) {
    try {
      const {
        sumField,
        groupByField,
        filter = {},
        limit = 10,
        period,
      } = options;

      let dateFilter = {};
      if (period) {
        const { startThis } = this.getPeriodDates(period);
        dateFilter = { createdAt: { $gte: startThis } };
      }

      this.pipeline = [
        { $match: { ...filter, ...dateFilter } },
        {
          $group: {
            _id: `$${groupByField}`,
            totalValue: { $sum: `$${sumField}` },
            count: { $sum: 1 },
            averageValue: { $avg: `$${sumField}` },
            firstSeen: { $min: '$createdAt' },
            lastSeen: { $max: '$createdAt' },
          },
        },
        { $sort: { totalValue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            [groupByField]: '$_id',
            totalValue: { $round: ['$totalValue', 2] },
            count: 1,
            averageValue: { $round: ['$averageValue', 2] },
            firstSeen: 1,
            lastSeen: 1,
            rank: { $add: [{ $indexOfArray: [[], null] }, 1] },
          },
        },
      ];

      return await this.execute();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to get top performers: ${errorMessage}`
      );
    }
  }
}

// ====== HELPER FUNCTION ======
const calculateGrowthDynamic = async (
  Model: any,
  options: {
    sumField?: string;
    filter?: Record<string, any>;
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  } = {}
) => {
  try {
    const aggregationBuilder = new AggregationBuilder(Model);
    return await aggregationBuilder.calculateGrowth(options);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to calculate growth dynamically: ${errorMessage}`
    );
  }
};

export default AggregationBuilder;
export { calculateGrowthDynamic };
