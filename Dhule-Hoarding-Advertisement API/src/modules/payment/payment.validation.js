const { z } = require("zod");

// const illegalHoardPaymentSchema = z.object({
//   userId: z.string().trim().optional().default(""),

//   ulbId: z.coerce.number().int().positive(),

//   noticeNo: z.string().trim(),

//   paymentMode: z.coerce.number(),

//   bankName: z.string().trim().optional().default(""),

//   bankBranch: z.string().trim().optional().default(""),

//   chequeNo: z.string().trim().optional().default(""),

//   chequeDate: z.string().trim().optional().nullable(),

//   remark: z.string().trim().optional().default(""),

//   micrCode: z.string().trim().optional().default(""),

//   chequeType: z.string().trim().optional().default(""),

//   transactionId: z.string().trim().optional().default(""),

//   mobileNo: z.coerce.number().optional().nullable(),

//   email: z.string().trim().email().optional().nullable(),

//   address: z.string().trim().optional().default(""),

//   name: z.string().trim(),

//   collectionAmount: z.coerce.number(),
// });

const illegalHoardPaymentSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  ulbId: z.coerce.number().int().positive("ULB ID must be a positive integer"),
  mobileNo: z.coerce
    .number()
    .int("Mobile number must be an integer")
    .positive("Mobile number must be positive"),
  email: z.string().trim().email("Invalid email format"),
  address: z.string().trim().min(1, "Address is required"),
  name: z.string().trim().min(1, "Name is required"),

  noticeNo: z.string().trim().nullish(),
  paymentMode: z.string().trim().nullish(),
  bankName: z.string().trim().nullish(),
  bankBranch: z.string().trim().nullish(),
  chequeNo: z.string().trim().nullish(),
  chequeDate: z.string().trim().nullish(),
  remark: z.string().trim().nullish(),
  micrCode: z.string().trim().nullish(),
  chequeType: z.string().trim().nullish(),
  transactionId: z.string().trim().nullish(),
  collectionAmount: z.coerce.number().nullish(),
});
module.exports = {
  illegalHoardPaymentSchema,
};
