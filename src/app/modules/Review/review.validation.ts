import { z } from 'zod'

const createReviewValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Review name is required.' }),
  }),
})

export const ReviewValidation = {
  createReviewValidationSchema,
}
