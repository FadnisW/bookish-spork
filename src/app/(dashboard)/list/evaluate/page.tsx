import prisma from "@/lib/prisma";
import BulkEvaluateForm from "@/components/forms/BulkEvaluateForm";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const BulkEvaluatePage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // Only teachers and admins can evaluate
  if (role !== "admin" && role !== "teacher") {
    return notFound();
  }

  const { type, id } = await searchParams; // type = 'exam' or 'assignment', id = assessment id
  
  if (!type || !id || (type !== "exam" && type !== "assignment")) {
    return notFound();
  }

  const assessmentId = parseInt(id);

  let assessmentData: any = null;
  let classId: number | null = null;
  let teacherId: string | null = null;

  // 1. Fetch Assessment Data & Verify Ownership
  if (type === "exam") {
    assessmentData = await prisma.exam.findUnique({
      where: { id: assessmentId },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });
  } else {
    assessmentData = await prisma.assignment.findUnique({
      where: { id: assessmentId },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });
  }

  if (!assessmentData) {
    return notFound();
  }

  classId = assessmentData.lesson.classId;
  teacherId = assessmentData.lesson.teacherId;

  // Enforce Teacher Authorization 
  if (role === "teacher" && teacherId !== currentUserId) {
    return notFound(); // Cannot grade someone else's assessment
  }

  // 2. Fetch all students in the class
  const students = classId ? await prisma.student.findMany({
    where: { classId },
    orderBy: { name: "asc" },
  }) : [];

  // 3. Fetch existing results for this assessment
  const existingResults = await prisma.result.findMany({
    where: {
      [type === "exam" ? "examId" : "assignmentId"]: assessmentId,
    },
  });

  // 4. Map existing results to students so form can pre-fill
  const studentsWithResults = students.map((student) => {
    const existingResult = existingResults.find((r) => r.studentId === student.id);
    return {
      id: student.id,
      name: student.name,
      surname: student.surname,
      resultId: existingResult?.id,
      score: existingResult?.score,
      // @ts-ignore: Prisma schema cache workaround
      feedback: existingResult?.feedback,
    };
  });

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex flex-col gap-1">
            <span className="text-gray-500 text-sm uppercase tracking-wide font-medium">
              Bulk Grading: {type}
            </span>
            {assessmentData.title}
          </h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Image src="/subject.png" alt="" width={16} height={16} />
              <span>{assessmentData.lesson.subject.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Image src="/class.png" alt="" width={16} height={16} />
              <span>{assessmentData.lesson.class.name}</span>
            </div>
          </div>
        </div>
        
        <Link 
          href={`/list/${type}s`}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          Back to list
        </Link>
      </div>

      {/* FORM SECTION */}
      <BulkEvaluateForm 
        students={studentsWithResults} 
        examId={type === "exam" ? assessmentId : undefined}
        assignmentId={type === "assignment" ? assessmentId : undefined}
      />
    </div>
  );
};

export default BulkEvaluatePage;
