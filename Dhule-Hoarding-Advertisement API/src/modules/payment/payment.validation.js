const { z } = require('zod');

const illegalHoardPaymentSchema = z.object({
  userId: z.string().trim().optional().default(""),

  ulbId: z.coerce.number().int().positive(),

  noticeNo: z.string().trim(),

  paymentMode: z.coerce.number(),

  bankName: z.string().trim().optional().default(""),

  bankBranch: z.string().trim().optional().default(""),

  chequeNo: z.string().trim().optional().default(""),

  chequeDate: z.string().trim().optional().nullable(),

  remark: z.string().trim().optional().default(""),

  micrCode: z.string().trim().optional().default(""),

  chequeType: z.string().trim().optional().default(""),

  transactionId: z.string().trim().optional().default(""),

  mobileNo: z.coerce.number().optional().nullable(),

  email: z.string().trim().email().optional().nullable(),

  address: z.string().trim().optional().default(""),

  name: z.string().trim(),

  collectionAmount: z.coerce.number(),
});

module.exports = {
illegalHoardPaymentSchema
};
