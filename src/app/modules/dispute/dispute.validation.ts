import { z } from 'zod';
import {
  DisputeType,
  DisputeStatus,
  DisputeResolution,
} from './dispute.interface';

const createDisputeSchema = z.object({
  body: z.object({
    taskId: z
      .string({
        required_error: 'Task ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID format'),

    type: z.nativeEnum(DisputeType, {
      required_error: 'Dispute type is required',
    }),

    title: z
      .string({
        required_error: 'Dispute title is required',
      })
      .min(5, 'Title must be at least 5 characters long')
      .max(200, 'Title cannot exceed 200 characters'),

    description: z
      .string({
        required_error: 'Dispute description is required',
      })
      .min(20, 'Description must be at least 20 characters long')
      .max(2000, 'Description cannot exceed 2000 characters'),

    posterId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid poster ID format')
      .optional(),
    freelancerId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid freelancer ID format')
      .optional(),

    evidence: z
      .array(
        z.object({
          type: z
            .enum(['screenshot', 'document', 'communication', 'other'])
            .optional(),
          description: z.string().min(10).max(500).optional(),
          attachments: z.array(z.string().url()).optional(),
        })
      )
      .optional(),
  }),
});

const addEvidenceSchema = z.object({
  params: z.object({
    disputeId: z
      .string({
        required_error: 'Dispute ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid dispute ID format'),
  }),
  body: z.object({
    type: z.enum(['screenshot', 'document', 'communication', 'other'], {
      required_error: 'Evidence type is required',
    }),
    description: z
      .string({
        required_error: 'Evidence description is required',
      })
      .min(10, 'Description must be at least 10 characters long')
      .max(500, 'Description cannot exceed 500 characters'),
    attachments: z.array(z.string().url()).optional(),
  }),
});

const updateDisputeStatusSchema = z.object({
  params: z.object({
    disputeId: z
      .string({
        required_error: 'Dispute ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid dispute ID format'),
  }),
  body: z.object({
    status: z.nativeEnum(DisputeStatus, {
      required_error: 'Status is required',
    }),
  }),
});

const resolveDisputeSchema = z.object({
  params: z.object({
    disputeId: z
      .string({
        required_error: 'Dispute ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid dispute ID format'),
  }),
  body: z.object({
    resolution: z.nativeEnum(DisputeResolution, {
      required_error: 'Resolution decision is required',
    }),
    adminNotes: z.string().min(10).max(1000).optional(),
    refundPercentage: z.number().min(0).max(100).optional(),
  }),
});

// ------------------------
// Get Disputes Validation (Query Filters & Pagination)
// ------------------------
const getDisputesSchema = z.object({
  query: z.object({
    status: z.nativeEnum(DisputeStatus).optional(),
    type: z.nativeEnum(DisputeType).optional(),
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .optional(),
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .optional(),
  }),
});

export const DisputeValidation = {
  createDisputeSchema,
  addEvidenceSchema,
  updateDisputeStatusSchema,
  resolveDisputeSchema,
  getDisputesSchema,
};
