import Announcements from "@/components/announcements";
import BigCalendarContainer from "@/components/bigCalendarContainer";
import FormContainer from "@/components/formContainer";
import Performance from "@/components/performance";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ShortcutLink from "@/components/ShortcutLink";
import { getAllGrades, getAllClasses } from "@/lib/actions";
import { Suspense } from "react";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";

const SingleStudentPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: {
        include: {
          _count: { select: { lessons: true } },
          lessons: {
            select: {
              _count: { select: { exams: true, assignments: true } },
              teacher: { select: { id: true, name: true, surname: true } },
            },
          },
        },
      },
      grade: true,
      parent: true,
      _count: {
        select: {
          attendances: true,
          results: true,
        },
      },
    },
  });

  if (!student) {
    return notFound();
  }

  // Aggregate counts for shortcuts
  const lessonCount = student.class._count.lessons;
  const examCount = student.class.lessons.reduce((acc, curr) => acc + curr._count.exams, 0);
  const assignmentCount = student.class.lessons.reduce((acc, curr) => acc + curr._count.assignments, 0);
  // Get unique teacher count from class lessons
  const uniqueTeacherIds = new Set(student.class.lessons.map((l) => l.teacher.id));
  const teacherCount = uniqueTeacherIds.size;
  const resultCount = student._count.results;

  const grades = await getAllGrades();
  const classes = await getAllClasses();

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            <div className="flex-shrink-0">
              <Image
                src={student.img || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <h1 className="text-xl font-semibold">
                  {student.name + " " + student.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer
                    table="student"
                    type="update"
                    relatedData={{ grades: JSON.parse(JSON.stringify(grades)), classes: JSON.parse(JSON.stringify(classes)) }}
                    data={{
                      id: student.id,
                      username: student.username,
                      name: student.name,
                      surname: student.surname,
                      email: student.email,
                      phone: student.phone,
                      address: student.address,
                      bloodType: student.bloodType,
                      sex: student.sex,
                      img: student.img,
                      gradeId: student.gradeId,
                      classId: student.classId,
                      parentId: student.parentId,
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{student.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>
                    {new Intl.DateTimeFormat("en-IN").format(student.birthday)}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{student.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{student.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <Suspense fallback={
              <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
                <Image src="/singleAttendance.png" alt="" width={24} height={24} className="w-6 h-6" />
                <div className="">
                  <h1 className="text-xl font-semibold">...</h1>
                  <span className="text-sm text-gray-400">Attendance</span>
                </div>
              </div>
            }>
              <StudentAttendanceCard id={id} />
            </Suspense>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{student.grade.level}th</h1>
                <span className="text-sm text-gray-400">Grade</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{lessonCount}</h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{student.class.name}</h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 h-[calc(180vh-40px)] bg-white p-4 rounded-md">
          <h1>Student&apos;s Schedule</h1>
          <div className="h-[calc(100%-100px)]">
            <BigCalendarContainer type="classId" id={student.classId} />
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <ShortcutLink
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/lessons?classId=${student.classId}`}
              label="Student's Lessons"
              count={lessonCount}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/teachers?classId=${student.classId}`}
              label="Student's Teachers"
              count={teacherCount}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?classId=${student.classId}`}
              label="Student's Exams"
              count={examCount}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?classId=${student.classId}`}
              label="Student's Assignments"
              count={assignmentCount}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/results?studentId=${student.id}`}
              label="Student's Results"
              count={resultCount}
            />
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;