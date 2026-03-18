"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  AssignmentSchema,
  ResultSchema,
  BulkResultSchema,
  ParentSchema,
  BulkAttendanceSchema,
} from "./formValidationsSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };
export async function createSubject(data: SubjectSchema) {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId: string) => ({
            id: teacherId,
          })),
        },
      },
    });
    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
}

export async function updateSubject(data: SubjectSchema) {
  try {
    await prisma.subject.update({
      where: { id: data.id },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId: string) => ({ id: teacherId })),
        },
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
}

export async function getAllTeachers() {
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
    orderBy: { name: "asc" },
  });
  return teachers;
}

export async function getAllGrades() {
  const grades = await prisma.grade.findMany({
    select: { id: true, level: true },
    orderBy: { level: "asc" },
  });
  return grades;
}

export async function getAllSubjects() {
  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return subjects;
}

export async function getAllClasses() {
  const classes = await prisma.class.findMany({
    select: { id: true, name: true, capacity: true, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
  return classes;
}

export async function getAllLessons(teacherId?: string) {
  const lessons = await prisma.lesson.findMany({
    where: teacherId ? { teacherId } : {},
    select: {
      id: true,
      name: true,
      subject: { select: { name: true } },
      class: { select: { name: true } },
      teacher: { select: { name: true, surname: true } },
    },
    orderBy: { name: "asc" },
  });
  return lessons;
}


export async function deleteSubject(
  currentState: CurrentState,
  formData: FormData
) {
  const id = formData.get("id");
  if (!id) return { success: false, error: true };
  try {
    await prisma.subject.delete({
      where: { id: Number(id) },
    });
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
}

export async function createClass(data: ClassSchema) {
  try {
    await prisma.class.create({
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
}

export async function updateClass(data: ClassSchema) {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
}

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (data: TeacherSchema) => {
  try {
    if (!data.password || data.password === "") {
      return { success: false, error: true, message: "Password is required to create a teacher!" };
    }

    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher" },
    });

    // Create Prisma record — rollback Clerk user if this fails
    try {
      await prisma.teacher.create({
        data: {
          id: user.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          img: data.img || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          subjects: {
            connect: data.subjects?.map((subjectId: string) => ({
              id: parseInt(subjectId),
            })),
          },
        },
      });
    } catch (prismaErr: any) {
      console.log("[createTeacher] Prisma failed, rolling back Clerk user:", user.id);
      await client.users.deleteUser(user.id);
      throw prismaErr;
    }

    revalidatePath("/list/teachers");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[createTeacher] Error:", err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || err);
    return { success: false, error: true, message: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Failed to create teacher" };
  }
};

export const updateTeacher = async (data: TeacherSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Teacher ID is missing" };
  }
  try {
    const client = await clerkClient();
    const user = await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password ? { password: data.password } : {}),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {

        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    revalidatePath("/list/teachers");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[updateTeacher] Error:", err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || err);
    return { success: false, error: true, message: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Failed to update teacher" };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    try {
      await client.users.deleteUser(id);
    } catch (clerkErr: any) {
      if (clerkErr.errors?.[0]?.code === "resource_not_found") {
        console.log(`Clerk user ${id} not found, proceeding with local deletion.`);
      } else {
        throw clerkErr; 
      }
    }

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (data: StudentSchema) => {
  try {
    // ---------- Pre-validate FK references ----------
    if (!data.password || data.password === "") {
      return { success: false, error: true, message: "Password is required to create a student!" };
    }

    const parentExists = await prisma.parent.findUnique({ where: { id: data.parentId } });
    if (!parentExists) {
      return { success: false, error: true, message: "Parent ID does not exist! Please provide a valid Parent ID." };
    }

    const gradeExists = await prisma.grade.findUnique({ where: { id: data.gradeId } });
    if (!gradeExists) {
      return { success: false, error: true, message: "Selected grade does not exist!" };
    }

    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });
    if (!classItem) {
      return { success: false, error: true, message: "Selected class does not exist!" };
    }
    if (classItem.capacity === classItem._count.students) {
      return { success: false, error: true, message: "Class has reached its capacity!" };
    }

    // ---------- Create Clerk user ----------
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "student" },
    });

    // ---------- Create Prisma record (rollback Clerk on failure) ----------
    try {
      await prisma.student.create({
        data: {
          id: user.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          img: data.img || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          gradeId: data.gradeId,
          classId: data.classId,
          parentId: data.parentId,
        },
      });
    } catch (prismaErr: any) {
      // Prisma failed — roll back the Clerk user so we don't leave orphans
      console.log("[createStudent] Prisma failed, rolling back Clerk user:", user.id);
      await client.users.deleteUser(user.id);
      throw prismaErr;
    }

    revalidatePath("/list/students");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[createStudent] Error:", err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || err);
    return { success: false, error: true, message: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Failed to create student" };
  }
};

export const updateStudent = async (data: StudentSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Student ID is missing" };
  }
  try {
    // ---------- Pre-validate FK references ----------
    const parentExists = await prisma.parent.findUnique({ where: { id: data.parentId } });
    if (!parentExists) {
      return { success: false, error: true, message: "Parent ID does not exist! Please provide a valid Parent ID." };
    }

    const gradeExists = await prisma.grade.findUnique({ where: { id: data.gradeId } });
    if (!gradeExists) {
      return { success: false, error: true, message: "Selected grade does not exist!" };
    }

    const classItem = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!classItem) {
      return { success: false, error: true, message: "Selected class does not exist!" };
    }

    // ---------- Update Clerk user ----------
    const client = await clerkClient();
    await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password ? { password: data.password } : {}),
      firstName: data.name,
      lastName: data.surname,
    });

    // ---------- Update Prisma record ----------
    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });
    revalidatePath("/list/students");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[updateStudent] Error:", err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || err);
    return { success: false, error: true, message: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Failed to update student" };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    try {
      await client.users.deleteUser(id);
    } catch (clerkErr: any) {
      if (clerkErr.errors?.[0]?.code === "resource_not_found") {
        console.log(`Clerk user ${id} not found, proceeding with local deletion.`);
      } else {
        throw clerkErr; 
      }
    }

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (data: ExamSchema) => {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Pre-validate lessonId
    const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
    if (!lesson) {
      return { success: false, error: true, message: "Selected lesson does not exist!" };
    }

    // Teacher can only create exams for their own lessons
    if (role === "teacher") {
      if (lesson.teacherId !== userId) {
        return { success: false, error: true, message: "You can only create exams for your own lessons!" };
      }
    }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[createExam] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to create exam" };
  }
};

export const updateExam = async (data: ExamSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Exam ID is missing" };
  }
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Pre-validate lessonId
    const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
    if (!lesson) {
      return { success: false, error: true, message: "Selected lesson does not exist!" };
    }

    // Teacher can only update exams for their own lessons
    if (role === "teacher") {
      if (lesson.teacherId !== userId) {
        return { success: false, error: true, message: "You can only update exams for your own lessons!" };
      }
      // Also verify the existing exam belongs to this teacher
      const existingExam = await prisma.exam.findUnique({
        where: { id: data.id },
        include: { lesson: true },
      });
      if (!existingExam || existingExam.lesson.teacherId !== userId) {
        return { success: false, error: true, message: "You do not have permission to update this exam!" };
      }
    }

    await prisma.exam.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[updateExam] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to update exam" };
  }
};


export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // Teacher can only delete their own exams
        ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.log("[deleteExam] Error:", err.message || err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.parent.delete({
      where: {
        id: id,
      },
    });

    const client = await clerkClient();
    await client.users.deleteUser(id);

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (data: ParentSchema) => {
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
    });

    try {
      await prisma.parent.create({
        data: {
          id: user.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone,
          address: data.address,
        },
      });
    } catch (prismaErr: any) {
      console.log("[createParent] Prisma failed, rolling back Clerk user:", user.id);
      await client.users.deleteUser(user.id);
      throw prismaErr;
    }

    revalidatePath("/list/parents");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[createParent] Error:", err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || err);
    return { success: false, error: true, message: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Failed to create parent" };
  }
};

export const updateParent = async (data: ParentSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Parent ID is missing" };
  }
  try {
    const client = await clerkClient();
    await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password ? { password: data.password } : {}),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });
    revalidatePath("/list/parents");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[updateParent] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to update parent" };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (data: AssignmentSchema) => {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Pre-validate lessonId
    const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
    if (!lesson) {
      return { success: false, error: true, message: "Selected lesson does not exist!" };
    }

    // Teacher can only create assignments for their own lessons
    if (role === "teacher") {
      if (lesson.teacherId !== userId) {
        return { success: false, error: true, message: "You can only create assignments for your own lessons!" };
      }
    }

    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[createAssignment] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to create assignment" };
  }
};

export const updateAssignment = async (data: AssignmentSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Assignment ID is missing" };
  }
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Pre-validate lessonId
    const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
    if (!lesson) {
      return { success: false, error: true, message: "Selected lesson does not exist!" };
    }

    // Teacher can only update assignments for their own lessons
    if (role === "teacher") {
      if (lesson.teacherId !== userId) {
        return { success: false, error: true, message: "You can only update assignments for your own lessons!" };
      }
      // Also verify the existing assignment belongs to this teacher
      const existingAssignment = await prisma.assignment.findUnique({
        where: { id: data.id },
        include: { lesson: true },
      });
      if (!existingAssignment || existingAssignment.lesson.teacherId !== userId) {
        return { success: false, error: true, message: "You do not have permission to update this assignment!" };
      }
    }

    await prisma.assignment.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[updateAssignment] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to update assignment" };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
        // Teacher can only delete their own assignments
        ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.log("[deleteAssignment] Error:", err.message || err);
    return { success: false, error: true };
  }
};

export const createResult = async (data: ResultSchema) => {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!data.examId && !data.assignmentId) {
      return { success: false, error: true, message: "A result must be linked to either an Exam or an Assignment!" };
    }

    // Teacher can only assign results for their own exams/assignments
    if (role === "teacher") {
      let lessonId;
      if (data.examId) {
        const exam = await prisma.exam.findUnique({ where: { id: data.examId } });
        lessonId = exam?.lessonId;
      } else if (data.assignmentId) {
        const assignment = await prisma.assignment.findUnique({ where: { id: data.assignmentId } });
        lessonId = assignment?.lessonId;
      }

      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (lesson?.teacherId !== userId) {
          return { success: false, error: true, message: "You can only assign results for your own lessons!" };
        }
      } else {
        return { success: false, error: true, message: "Assessment not found!" };
      }
    }

    await prisma.result.create({
      data: {
        score: data.score,
        // @ts-ignore: Prisma cache workaround for the new schema column
        feedback: data.feedback,
        studentId: data.studentId,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      },
    });

    revalidatePath("/list/results");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[createResult] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to create result" };
  }
};

export const updateResult = async (data: ResultSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Result ID is missing" };
  }
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!data.examId && !data.assignmentId) {
      return { success: false, error: true, message: "A result must be linked to either an Exam or an Assignment!" };
    }

    if (role === "teacher") {
      // Veryify the teacher owns the new assignment/exam they are linking
      let lessonId;
      if (data.examId) {
        const exam = await prisma.exam.findUnique({ where: { id: data.examId } });
        lessonId = exam?.lessonId;
      } else if (data.assignmentId) {
        const assignment = await prisma.assignment.findUnique({ where: { id: data.assignmentId } });
        lessonId = assignment?.lessonId;
      }

      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (lesson?.teacherId !== userId) {
          return { success: false, error: true, message: "You can only edit results for your own lessons!" };
        }
      }

      // Verify the teacher owns the original result they are trying to update
      const existingResult = await prisma.result.findUnique({
        where: { id: data.id },
        include: {
          exam: { include: { lesson: true } },
          assignment: { include: { lesson: true } },
        },
      });

      const originalTeacherId = existingResult?.exam
        ? existingResult.exam.lesson.teacherId
        : existingResult?.assignment?.lesson.teacherId;

      if (originalTeacherId !== userId) {
        return { success: false, error: true, message: "You do not have permission to update this result!" };
      }
    }

    await prisma.result.update({
      where: { id: data.id },
      data: {
        score: data.score,
        // @ts-ignore: Prisma cache workaround for the new schema column
        feedback: data.feedback,
        studentId: data.studentId,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      },
    });

    revalidatePath("/list/results");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[updateResult] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to update result" };
  }
};

export const saveBulkResults = async (data: BulkResultSchema) => {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!data.examId && !data.assignmentId) {
      return { success: false, error: true, message: "A result must be linked to either an Exam or an Assignment!" };
    }

    // Teacher can only assign results for their own exams/assignments
    if (role === "teacher") {
      let lessonId;
      if (data.examId) {
        const exam = await prisma.exam.findUnique({ where: { id: data.examId } });
        lessonId = exam?.lessonId;
      } else if (data.assignmentId) {
        const assignment = await prisma.assignment.findUnique({ where: { id: data.assignmentId } });
        lessonId = assignment?.lessonId;
      }

      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (lesson?.teacherId !== userId) {
          return { success: false, error: true, message: "You can only assign results for your own lessons!" };
        }
      } else {
        return { success: false, error: true, message: "Assessment not found!" };
      }
    }

    // Use Prisma transaction boundaries to ensure safety matching single-CRUD mapping limits
    const transactions = data.results.map((res) => {
      // If result already has an ID, update it natively instead of upserting globally
      if (res.id) {
        return prisma.result.update({
          where: { id: res.id },
          data: {
            score: res.score,
            // @ts-ignore: Prisma cache workaround
            feedback: res.feedback || null,
          },
        });
      } else {
        return prisma.result.create({
          data: {
            score: res.score,
            // @ts-ignore: Prisma cache workaround
            feedback: res.feedback || null,
            studentId: res.studentId,
            examId: data.examId || null,
            assignmentId: data.assignmentId || null,
          },
        });
      }
    });

    await prisma.$transaction(transactions);

    revalidatePath("/list/results");
    return { success: true, error: false, message: "" };
  } catch (err: any) {
    console.log("[saveBulkResults] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to bulk save results" };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Check ownership before deleting
    if (role === "teacher") {
      const existingResult = await prisma.result.findUnique({
        where: { id: parseInt(id) },
        include: {
          exam: { include: { lesson: true } },
          assignment: { include: { lesson: true } },
        },
      });

      const originalTeacherId = existingResult?.exam
        ? existingResult.exam.lesson.teacherId
        : existingResult?.assignment?.lesson.teacherId;

      if (originalTeacherId !== userId) {
        return { success: false, error: true };
      }
    }

    await prisma.result.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err: any) {
    console.log("[deleteResult] Error:", err.message || err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.attendance.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const saveBulkAttendance = async (data: BulkAttendanceSchema) => {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (!userId || !role) throw new Error("Unauthorized");

    // 1. Validate Scope & Authorization
    const { date, classId, lessonId, forceOverride, records } = data;
    
    // Get class info
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new Error("Class not found");

    if (role === "teacher") {
       if (!lessonId && cls.supervisorId !== userId) {
          throw new Error("Only the Class Supervisor can mark 'Whole Day' attendance.");
       }
       if (lessonId) {
          const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
          if (!lesson || (lesson.teacherId !== userId && cls.supervisorId !== userId)) {
             throw new Error("You do not have permission to mark this lesson.");
          }
       }
    }

    // 2. Resolve Lessons to Update
    let targetLessons: number[] = [];
    if (lessonId) {
       targetLessons = [lessonId];
    } else {
       // 'Whole Day' logic
       // Convert Date object to day of week enum (MONDAY, TUESDAY...)
       const jsDate = new Date(date);
       const dayOfWeekNum = jsDate.getDay(); // 0 is Sunday, 1 is Monday...
       const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
       const currentDayString = days[dayOfWeekNum];
       
       const todaysLessons = await prisma.lesson.findMany({
          where: { classId, day: currentDayString as any },
          select: { id: true, teacherId: true }
       });
       targetLessons = todaysLessons.map(l => l.id);
    }

    if (targetLessons.length === 0) {
       return { success: true, error: false, message: "No lessons found for this date/class." };
    }

    // 3. Prevent edits locked after 48 hours
    const LOCK_MS = 48 * 60 * 60 * 1000;
    const now = new Date().getTime();

    // 4. Build PRISMA TX Operations
    const operations = [];

    // Fetch existing records for these students and lessons on this date
    // We compare date loosely avoiding timezone shifts
    const startOfDay = new Date(new Date(date).setHours(0,0,0,0));
    const endOfDay = new Date(new Date(date).setHours(23,59,59,999));

    const existingRecords = await prisma.attendance.findMany({
       where: {
          studentId: { in: records.map(r => r.studentId) },
          lessonId: { in: targetLessons },
          date: {
             gte: startOfDay,
             lte: endOfDay
          }
       }
    });

    const existingMap = new Map();
    existingRecords.forEach(r => {
       existingMap.set(`${r.studentId}-${r.lessonId}`, r);
    });

    for (const record of records) {
       for (const targetLessonId of targetLessons) {
          const mapKey = `${record.studentId}-${targetLessonId}`;
          const existing = existingMap.get(mapKey);

          // Lock check
          if (existing && existing.updatedAt) {
             const timeDiff = now - new Date(existing.updatedAt).getTime();
             if (timeDiff > LOCK_MS) continue; // Skip locked
          }

          // Conflict Resolution: If Whole Day but already marked by Specific Teacher, skip unless forceOverride
          if (!lessonId && existing && existing.markedBy !== userId) {
             if (!forceOverride) continue; // Skip because another teacher marked it
          }

          if (existing) {
             operations.push(
               prisma.attendance.update({
                  where: { id: existing.id },
                  data: {
                     status: record.status,
                     remarks: record.remark || null,
                     minutesLate: record.minutesLate || null,
                     updatedBy: userId,
                  } as any
               })
             );
          } else {
             operations.push(
               prisma.attendance.create({
                  data: {
                     date: startOfDay, // Storing exactly at midnight to avoid tz issues
                     status: record.status,
                     remarks: record.remark || null,
                     minutesLate: record.minutesLate || null,
                     studentId: record.studentId,
                     lessonId: targetLessonId,
                     teacherId: userId,
                     markedBy: userId,
                     updatedBy: userId,
                     present: record.status === "PRESENT" || record.status === "LATE", // To satisfy legacy schema requirement
                  } as any
               })
             );
          }
       }
    }

    if (operations.length > 0) {
       await prisma.$transaction(operations);
    }

    revalidatePath("/list/attendance");
    return { success: true, error: false, message: "Attendance saved successfully." };

  } catch (err: any) {
    console.log("[saveBulkAttendance] Error:", err.message || err);
    return { success: false, error: true, message: err.message || "Failed to save attendance" };
  }
};

export const submitAbsenceNote = async (attendanceId: number, attachmentUrl: string) => {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== "parent" && role !== "admin") throw new Error("Unauthorized");

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { student: true }
    });

    if (!attendance || (role === "parent" && attendance.student.parentId !== userId)) {
      throw new Error("Unauthorized or record not found.");
    }

    await prisma.attendance.update({
      where: { id: attendanceId },
      data: { attachment: attachmentUrl, status: "EXCUSED", updatedBy: userId } as any
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err: any) {
    console.log("[submitAbsenceNote] Error:", err.message || err);
    return { success: false, error: true, message: err.message };
  }
};
