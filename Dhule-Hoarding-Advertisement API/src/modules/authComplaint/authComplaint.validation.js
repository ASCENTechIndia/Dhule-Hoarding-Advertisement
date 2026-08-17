const { z } = require("zod");

const authComplaintSchema = z.object({
  userId: z.string().trim().min(1),
  applId: z.coerce.number().int().positive(),
  ulbId: z.coerce.number().int().positive(),
  mode: z.coerce.number().int().min(1),
  status: z.string().trim().min(1),
  remark: z.string().trim().min(1),
  userType: z.string().trim().min(1),
  inspectionImg1: z.string().nullable().optional(),
  inspectionImg2: z.string().nullable().optional(),
  inspectionImg3: z.string().nullable().optional(),
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
   ulbId: z.union([
    z.string(),
    z.number()
  ]).transform((val) => Number(val))
   .pipe(z.number().int().positive()),
  vendorId: z.coerce.number().int().positive().optional(),
  solvedImg1: z.string().nullable().optional(),
  solvedImg2: z.string().nullable().optional(),
  solvedImg3: z.string().nullable().optional(),
  reworkflag: z.string().optional(),
  usertype: z.string().optional(),
  inspectionimg1: z.string().nullable().optional(),
  inspectionimg2: z.string().nullable().optional(),
  inspectionimg3: z.string().nullable().optional(),
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
