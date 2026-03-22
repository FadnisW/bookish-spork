import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()).min(1, { message: "At least one teacher must be selected!" }), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
  teachers: z.array(z.object({
    subjectId: z.coerce.number(),
    teacherId: z.string()
  })).optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0).max(100, { message: "Score must be between 0 and 100!" }),
  feedback: z.string().optional(),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  studentId: z.string().min(1, { message: "Student is required!" }),
});

export type ResultSchema = z.infer<typeof resultSchema>;

export const bulkResultSchema = z.object({
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  results: z.array(
    z.object({
      id: z.coerce.number().optional(),
      studentId: z.string(),
      score: z.coerce.number().min(0).max(100, { message: "Score must be between 0 and 100!" }),
      feedback: z.string().optional().or(z.literal("")),
    })
  ),
});

export type BulkResultSchema = z.infer<typeof bulkResultSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const bulkAttendanceSchema = z.object({
  date: z.coerce.date(),
  classId: z.coerce.number(),
  lessonId: z.coerce.number().optional(),
  forceOverride: z.boolean().optional(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED", "HALF_DAY"]),
      remark: z.string().optional().or(z.literal("")),
      minutesLate: z.coerce.number().optional()
    })
  )
});

export type BulkAttendanceSchema = z.infer<typeof bulkAttendanceSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Lesson name is required!" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], { message: "Day is required!" }),
  startTime: z.preprocess((val) => {
    if (typeof val === 'string' && val.includes(':')) {
       const today = new Date();
       const [hours, minutes] = val.split(':');
       today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
       return today;
    }
    return val;
  }, z.date({ message: "Start time is required!" })),
  endTime: z.preprocess((val) => {
    if (typeof val === 'string' && val.includes(':')) {
       const today = new Date();
       const [hours, minutes] = val.split(':');
       today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
       return today;
    }
    return val;
  }, z.date({ message: "End time is required!" })),
  subjectId: z.coerce.number({ message: "Subject is required!" }),
  classId: z.coerce.number({ message: "Class is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  room: z.string().optional(),
  lessonType: z.enum(["LECTURE", "LAB", "SEMINAR"]).optional().default("LECTURE"),
  status: z.enum(["ACTIVE", "CANCELLED", "SUBSTITUTED"]).optional().default("ACTIVE"),
  description: z.string().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time!",
  path: ["endTime"],
});

export type LessonSchema = z.infer<typeof lessonSchema>;

export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  classId: z.coerce.number().optional().transform(v => v === 0 ? undefined : v),
  teacherId: z.string().optional().transform(v => v === "" ? undefined : v),
  studentId: z.string().optional().transform(v => v === "" ? undefined : v),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time!",
  path: ["endTime"],
});

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  date: z.preprocess((val) => {
    if (typeof val === 'string' && val.length === 10) {
      return new Date(`${val}T00:00:00`); // Force local midnight
    }
    return val ? new Date(val as string) : val;
  }, z.date({ message: "Date is required!" })),
  classId: z.coerce.number().optional().transform(v => v === 0 ? undefined : v),
  teacherId: z.string().optional().transform(v => v === "" ? undefined : v),
  studentId: z.string().optional().transform(v => v === "" ? undefined : v),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;