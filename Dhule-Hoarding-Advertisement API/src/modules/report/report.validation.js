const { z } = require("zod");

const authComplaintSchema = z.object({
  userId: z.string().trim().min(1),
  applId: z.coerce.number().int().positive(),
  ulbId: z.coerce.number().int().positive(),
  mode: z.coerce.number().int().min(1),
  status: z.string().trim().min(1),
  remark: z.string().trim().min(1),
});

const complaintStatusSchema = z.object({
  userId: z.string().trim().min(1),
  mode: z.coerce.number().int().min(0),
  complaintId: z.coerce.number().int().positive(),
  superwiserId: z.string().optional(),
  superstatus: z.string().optional(),
  superremark: z.string().optional(),
  vendorRemark: z.string().optional(),
  SIID: z.string().optional(),
  si_status: z.string().optional(),
  si_remrk: z.string().optional(),
  wardno: z.coerce.number().int().positive(),
  ulbid: z.coerce.number().int().positive(),
  vendorId: z.coerce.number().int().positive().optional(),
  solvedImg1: z.string().nullable().optional(),
  solvedImg2: z.string().nullable().optional(),
  solvedImg3: z.string().nullable().optional(),
  reworkflag: z.string().optional(),
});

const complaintWorkStatusSchema = z.object({
  userId: z.string().trim().min(1),
  ulbId: z.coerce.number().int().positive(),
  attndDate: z.optional(),
  attndLat: z.string().trim().min(1),
  attndLong: z.string().trim().min(1),
  appSource: z.string().trim().min(1),
  flag: z.string().trim().min(1),
  remark: z.string().trim().min(1),
  toiletId: z.string().trim().min(1),
  solvcompimg1: z.optional(),
  solvcompimg2: z.optional(),
  solvcompimg3: z.optional(),
  workId: z.coerce.number().int(),
  workFlag: z.string().trim().min(1),
});

module.exports = {
  authComplaintSchema,
  complaintWorkStatusSchema,
};

module.exports.complaintStatusSchema = complaintStatusSchema;
