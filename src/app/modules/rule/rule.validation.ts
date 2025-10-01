import { z } from 'zod'

const createPrivacyPolicyZodSchema = z.object({
  body: z.object({
    content: z.string({ required_error: 'Privacy policy is required' }),
  }),
})
const updatePrivacyPolicyZodSchema = z.object({
  body: z.object({
    content: z.string().optional(),
  }),
})

const createTermsAndConditionZodSchema = z.object({
  body: z.object({
    content: z.string({ required_error: 'Terms and conditions is required' }),
  }),
})
const updateTermsAndConditionZodSchema = z.object({
  body: z.object({
    content: z.string().optional(),
  }),
})

const createAboutZodSchema = z.object({
  body: z.object({
    content: z.string({ required_error: 'About is required' }),
  }),
})

const updaterAboutZodSchema = z.object({
  body: z.object({
    content: z.string().optional(),
  }),
})

export const RuleValidation = {
  createPrivacyPolicyZodSchema,
  updatePrivacyPolicyZodSchema,
  createAboutZodSchema,
  updaterAboutZodSchema,
  createTermsAndConditionZodSchema,
  updateTermsAndConditionZodSchema,
}
