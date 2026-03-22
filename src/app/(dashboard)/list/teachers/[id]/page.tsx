import Announcements from "@/components/announcements";
import BigCalendarContainer from "@/components/bigCalendarContainer";
import FormContainer from "@/components/formContainer";
import Performance from "@/components/performance";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ShortcutLink from "@/components/ShortcutLink";
import { getAllSubjects } from "@/lib/actions";

const SingleTeacherPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
        },
      },
      subjects: true,
      classes: { select: { _count: { select: { students: true } } } },
      lessons: { select: { _count: { select: { exams: true, assignments: true } } } },
    },
  });

  if (!teacher) {
    return notFound();
  }
  
  // Aggregate nested counts that Prisma _count can't do natively
  const studentCount = teacher.classes.reduce((acc, curr) => acc + curr._count.students, 0);
  const examCount = teacher.lessons.reduce((acc, curr) => acc + curr._count.exams, 0);
  const assignmentCount = teacher.lessons.reduce((acc, curr) => acc + curr._count.assignments, 0);

  const allSubjects = await getAllSubjects();

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
                src={teacher.img || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name + " " + teacher.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer
                    table="teacher"
                    type="update"
                    relatedData={{ subjects: JSON.parse(JSON.stringify(allSubjects)) }}
                    data={{
                      id: teacher.id,
                      username: teacher.username,
                      name: teacher.name,
                      surname: teacher.surname,
                      email: teacher.email,
                      phone: teacher.phone,
                      address: teacher.address,
                      bloodType: teacher.bloodType,
                      sex: teacher.sex,
                      img: teacher.img,
                      subjects: JSON.parse(JSON.stringify(teacher.subjects)), // Ensure subjects can be serialized
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
                  <span>{teacher.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>
                    {new Intl.DateTimeFormat("en-IN").format(teacher.birthday)}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>
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
                <h1 className="text-xl font-semibold">
                  {teacher._count.subjects}
                </h1>
                <span className="text-sm text-gray-400">Branches</span>
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
                <h1 className="text-xl font-semibold">
                  {teacher._count.lessons}
                </h1>
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
                <h1 className="text-xl font-semibold">
                  {teacher._count.classes}
                </h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 h-[calc(180vh-40px)] bg-white p-4 rounded-md">
          <h1>Teacher&apos;s Schedule</h1>
          <div className="h-[calc(100%-100px)]">
            <BigCalendarContainer type="teacherId" id={teacher.id} />
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
              href={`/list/classes?supervisorId=${teacher.id}`}
              label="Teacher's Classes"
              count={teacher._count.classes}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/students?teacherId=${teacher.id}`}
              label="Teacher's Students"
              count={studentCount}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/lessons?teacherId=${teacher.id}`}
              label="Teacher's Lessons"
              count={teacher._count.lessons}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?teacherId=${teacher.id}`}
              label="Teacher's Exams"
              count={examCount}
            />
            <ShortcutLink
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?teacherId=${teacher.id}`}
              label="Teacher's Assignments"
              count={assignmentCount}
            />
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
