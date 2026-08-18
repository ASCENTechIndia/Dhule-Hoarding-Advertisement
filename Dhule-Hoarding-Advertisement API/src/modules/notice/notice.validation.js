const { z } = require('zod');

const noticeSchema = z.object({
  corporationLogo: z.string().nullable().optional(),
  corporationName: z.string().trim().optional().default('धुळे महानगरपालिका'),
  REGIONAL_OFFICE_NO: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  ADVERTISER_NAME: z.string().trim().optional().default(''),
  ADDRESS: z.string().trim().optional().default(''),
  LATITUDE: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  LONGITUDE: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  SIZE: z.string().trim().optional().default(''),
  FROM_DATE: z.string().trim().optional().default(''),
  TO_DATE: z.string().trim().optional().default(''),
  AMOUNT: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  OFFICER_NAME: z.string().trim().optional().default(''),
  OFFICER_DESIGNATION: z.string().trim().optional().default(''),
  REGIONAL_OFFICE: z.string().trim().optional().default(''),
  PANCHANAMA_NO: z.string()
    .trim()
    .optional()
    .default(""),

  ULB_ID: z.union([z.string(), z.number()])
    .transform(String)
    .optional()
    .default(""),
});

const getNoticeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).optional(),
});

module.exports = {
  noticeSchema,
  getNoticeSchema,
};
