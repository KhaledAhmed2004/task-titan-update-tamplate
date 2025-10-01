export interface IDashboardStats {
  allUsers: IStatisticSummary;
  posts: IStatisticSummary;
  revenue: IStatisticSummary;
  reports: IStatisticSummary;
}

export interface IStatisticSummary {
  total: number;
  formattedGrowth: string;
  growthType: 'increase' | 'decrease' | 'no_change';
}

export interface IMonthlyGrowthFilter {
  [key: string]: unknown;
}
