import { Report } from './report.model';
import {
  ICreateReport,
  IUpdateReport,
  IQueryReports,
  IReport,
  REPORT_STATUS,
} from './report.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AggregationBuilder from '../../builder/AggregationBuilder';

// Create a new report
const createReport = async (payload: ICreateReport): Promise<IReport> => {
  const report = await Report.create(payload);
  return report;
};

// const getAllReports = async (query: IQueryReports) => {
//   // ✅ Query builder for search, filter, pagination
//   const reportQuery = new QueryBuilder(
//     Report.find(),
//     query as Record<string, unknown>
//   )
//     .search(['title', 'description'])
//     .filter()
//     .sort()
//     .paginate()
//     .fields()
//     .populate(['reportedBy'], { reportedBy: 'name email role' });

//   const reports = await reportQuery.modelQuery;
//   const paginationInfo = await reportQuery.getPaginationInfo();

//   // ✅ Total counts
//   const totalReports = await Report.countDocuments();
//   const totalPending = await Report.countDocuments({
//     status: REPORT_STATUS.PENDING,
//   });
//   const totalReviewed = await Report.countDocuments({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const totalResolved = await Report.countDocuments({
//     status: REPORT_STATUS.RESOLVED,
//   });

//   // ✅ Function to calculate monthly growth for a given filter
//   const calculateMonthlyGrowth = async (
//     filter: Record<string, unknown> = {}
//   ) => {
//     const now = new Date();
//     const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

//     const thisMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfThisMonth },
//     });

//     const lastMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
//     });

//     let monthlyGrowth = 0;
//     let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

//     if (lastMonthCount > 0) {
//       monthlyGrowth =
//         ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
//       growthType =
//         monthlyGrowth > 0
//           ? 'increase'
//           : monthlyGrowth < 0
//           ? 'decrease'
//           : 'no_change';
//     } else if (thisMonthCount > 0 && lastMonthCount === 0) {
//       monthlyGrowth = 100;
//       growthType = 'increase';
//     }

//     const formattedGrowth =
//       (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';

//     return {
//       thisMonthCount,
//       lastMonthCount,
//       monthlyGrowth: Math.abs(monthlyGrowth),
//       formattedGrowth,
//       growthType,
//     };
//   };

//   // ✅ Calculate stats for all reports and by status
//   const allReportStats = await calculateMonthlyGrowth();
//   const pendingStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.PENDING,
//   });
//   const reviewedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const resolvedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.RESOLVED,
//   });

//   return {
//     pagination: paginationInfo,
//     data: {
//       stats: {
//         allReports: { total: totalReports, ...allReportStats },
//         pending: { total: totalPending, ...pendingStats },
//         reviewed: { total: totalReviewed, ...reviewedStats },
//         resolved: { total: totalResolved, ...resolvedStats },
//       },
//       reports,
//     },
//   };
// };

// Get a single report by ID

// Get all reports (without stats)
const getAllReports = async (query: IQueryReports) => {
  const reportQuery = new QueryBuilder(
    Report.find(),
    query as Record<string, unknown>
  )
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['reportedBy'], { reportedBy: 'name email role' });

  const reports = await reportQuery.modelQuery;
  const paginationInfo = await reportQuery.getPaginationInfo();

  return {
    pagination: paginationInfo,
    reports,
  };
};

// Get only stats
// const getReportStats = async () => {
//   const totalReports = await Report.countDocuments();
//   const totalPending = await Report.countDocuments({
//     status: REPORT_STATUS.PENDING,
//   });
//   const totalReviewed = await Report.countDocuments({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const totalResolved = await Report.countDocuments({
//     status: REPORT_STATUS.RESOLVED,
//   });

//   const calculateMonthlyGrowth = async (
//     filter: Record<string, unknown> = {}
//   ) => {
//     const now = new Date();
//     const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

//     const thisMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfThisMonth },
//     });

//     const lastMonthCount = await Report.countDocuments({
//       ...filter,
//       createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
//     });

//     let monthlyGrowth = 0;
//     let growthType: 'increase' | 'decrease' | 'no_change' = 'no_change';

//     if (lastMonthCount > 0) {
//       monthlyGrowth =
//         ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
//       growthType =
//         monthlyGrowth > 0
//           ? 'increase'
//           : monthlyGrowth < 0
//           ? 'decrease'
//           : 'no_change';
//     } else if (thisMonthCount > 0 && lastMonthCount === 0) {
//       monthlyGrowth = 100;
//       growthType = 'increase';
//     }

//     const formattedGrowth =
//       (monthlyGrowth > 0 ? '+' : '') + monthlyGrowth.toFixed(2) + '%';

//     return {
//       thisMonthCount,
//       lastMonthCount,
//       monthlyGrowth: Math.abs(monthlyGrowth),
//       formattedGrowth,
//       growthType,
//     };
//   };

//   const allReportStats = await calculateMonthlyGrowth();
//   const pendingStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.PENDING,
//   });
//   const reviewedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.REVIEWED,
//   });
//   const resolvedStats = await calculateMonthlyGrowth({
//     status: REPORT_STATUS.RESOLVED,
//   });

//   return {
//     allReports: { total: totalReports, ...allReportStats },
//     pending: { total: totalPending, ...pendingStats },
//     reviewed: { total: totalReviewed, ...reviewedStats },
//     resolved: { total: totalResolved, ...resolvedStats },
//   };
// };

const getReportStats = async () => {
  const builder = new AggregationBuilder(Report);

  const allReports = await builder.calculateGrowth({ period: 'month' });
  const pending = await builder.calculateGrowth({
    filter: { status: REPORT_STATUS.PENDING },
    period: 'month',
  });
  const reviewed = await builder.calculateGrowth({
    filter: { status: REPORT_STATUS.REVIEWED },
    period: 'month',
  });
  const resolved = await builder.calculateGrowth({
    filter: { status: REPORT_STATUS.RESOLVED },
    period: 'month',
  });

  return {
    allReports,
    pending,
    reviewed,
    resolved,
  };
};

const getReportById = async (reportId: string): Promise<IReport | null> => {
  const report = await Report.findById(reportId).populate(
    'reportedBy',
    'name email role'
  );
  return report;
};

// Update a report
const updateReport = async (
  reportId: string,
  payload: IUpdateReport
): Promise<IReport | null> => {
  const updatedReport = await Report.findByIdAndUpdate(reportId, payload, {
    new: true,
    runValidators: true,
  });
  return updatedReport;
};

// Delete a report
const deleteReport = async (reportId: string): Promise<IReport | null> => {
  const deletedReport = await Report.findByIdAndDelete(reportId);
  return deletedReport;
};

// Resolve a report
const resolveReport = async (reportId: string): Promise<IReport | null> => {
  const resolvedReport = await Report.findByIdAndUpdate(
    reportId,
    { status: REPORT_STATUS.RESOLVED },
    { new: true, runValidators: true }
  );

  return resolvedReport;
};

export const ReportService = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  resolveReport,
  getReportStats,
};
