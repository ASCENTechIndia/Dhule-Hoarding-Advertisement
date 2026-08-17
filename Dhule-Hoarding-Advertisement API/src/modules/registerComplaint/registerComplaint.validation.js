const { z } = require('zod');

const complaintRegistrationSchema = z.object({
  userId: z.union([z.string().trim().min(1), z.number()]).transform(String),
  ulbId: z.coerce.number().int().positive(),
  wardId: z.coerce.number().int().positive(),
  toiletId: z.coerce.number().int().positive(),
  complaintTypeId: z.coerce.number().int().positive(),
  citizenMn: z.string().trim().min(1),
  mobileNo: z.coerce.number().int().positive(),
  unitNo: z.coerce.number().int().positive(),
  complaintStatus: z.string().trim().min(1),
  complntRemark: z.string().trim().min(1),
  unitImg1: z.string().nullable().optional(),
  unitImg2: z.string().nullable().optional(),
  unitImg3: z.string().nullable().optional(),
  unitImg4: z.string().nullable().optional(),
  unitImg5: z.string().nullable().optional(),
});

const assignComplaintSchema = z.object({
  userId: z.union([z.string(), z.number()])
    .transform(String),
  complaintId: z.coerce.number().int().positive(),
  supervisorId: z.union([z.string(), z.number()])
    .transform(String),
  wardNo: z.coerce.number().int().positive(),
  ulbId: z.coerce.number().int().positive(),
  vendorId: z.coerce.number().int().positive(),
});

const participantRegistrationSchema = z.object({
    ulbId: z.coerce.number().int().positive(),

    participantName: z
        .string()
        .trim()
        .min(1, "Participant name is required"),

    address: z
        .string()
        .trim()
        .min(1, "Address is required"),

    prabhag: z
        .string()
        .trim()
        .min(1, "Prabhag is required")
        .regex(
            /^[0-9A-Za-z]+$/,
            "Prabhag can contain only numbers and letters"
        ),

    mobileNo: z.coerce.number().int().positive(),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .nullable()
        .optional(),

    materials: z
        .string()
        .trim()
        .min(1, "Materials information is required"),

    photo1: z.string().nullable().optional(),
    photo2: z.string().nullable().optional(),
    photo3: z.string().nullable().optional(),
    photo4: z.string().nullable().optional(),
    photo5: z.string().nullable().optional(),
    photo6: z.string().nullable().optional(),
});


const illegalHoardSchema = z.object({

    userId: z
        .string()
        .trim()
        .min(1, "User ID is required"),

    ulbId: z.coerce
        .number()
        .int()
        .positive(),

    nameFirst: z
        .string()
        .trim()
        .min(1, "Name is required"),

    positionFirst: z
        .string()
        .trim()
        .min(1, "Position is required"),

    address: z
        .string()
        .trim()
        .min(1, "Address is required"),

    users: z
        .string()
        .trim()
        .min(1, "Users information is required"),

    officerName: z
        .string()
        .trim()
        .min(1, "Officer name is required"),

    advertName: z
        .string()
        .trim()
        .min(1, "Advertisement name is required"),

    sizeLen: z.coerce
        .number()
        .positive(),

    sizeWidth: z.coerce
        .number()
        .positive(),

    illegalDt: z
        .string()
        .trim()
        .min(1, "Date is required"),

    nearPhoto: z
        .string()
        .nullable()
        .optional(),

    farPhoto: z
        .string()
        .nullable()
        .optional(),

    photo: z
        .string()
        .nullable()
        .optional(),

    latitude: z.coerce
        .number(),

    longitude: z.coerce
        .number(),
    prabhag: z
        .string()
        .trim()
        .min(1, "Prabhag is required"),    
});


module.exports = {
  complaintRegistrationSchema,
  assignComplaintSchema,
  participantRegistrationSchema,
  illegalHoardSchema
};
