import { z } from 'zod';

const getDashboardStatsSchema = z.object({
  query: z.object({}).optional(),
});

export const AdminValidation = {
  getDashboardStatsSchema,
};