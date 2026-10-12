import { z } from 'zod'

const createProductValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Product name is required.' }),
  }),
})


const createCategoryValidationSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Category title is required.' })
      .min(1, 'Category title cannot be empty.'),
  }),
});
export const ProductValidation = {
  createProductValidationSchema,
  createCategoryValidationSchema
}
