import FormModal from "@/components/formModal";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSearch from "@/components/tableSearch";
import { currentUserId, role } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";

type LessonList = Lesson & {class:Class} & {teacher:Teacher} & {subject:Subject}

const columns = [
  {
    header: "Subject Name",
    accessor: "name",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Room",
    accessor: "room",
    className: "hidden lg:table-cell",
  },
  {
    header: "Schedule",
    accessor: "schedule",
    className: "hidden lg:table-cell",
  },
  ...(role === "admin"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const LessonListPage = async (props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const searchParams = await props.searchParams;
  const{ page, ...queryParams} = await searchParams;
  const currentPage = Number(page) || 1;

  //Settingup Url Conditions
  const query: Prisma.LessonWhereInput = {};
  if(queryParams){
    for (const [ key, value ] of Object.entries(queryParams)){
      if(value!== undefined){
        switch(key){
            case "teacherId":
              query.teacherId = value;
              break;
              case "classId":
              query.classId = Number(value);
              break;
              case "search":
              query.OR =[
                {subject: {name: {contains: value, mode: "insensitive"}}},
                {class: {name: {contains: value, mode: "insensitive"}}},
                {teacher: {name: {contains: value, mode: "insensitive"}}},
                {teacher: {surname: {contains: value, mode: "insensitive"}}},
              ]
              break;
              default:
              break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        subject: {select: {name: true}},
        class: {select: {name: true}},
        teacher: {select: {name: true, surname: true}},
      },
      orderBy: {
        id: "asc",
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE*(currentPage-1),
    }),
    prisma.lesson.count({
      where: query,
    }),
  ]); 

  let subjectsInfo: any = [], classesInfo: any = [], teachersInfo: any = [];
  if (role === "admin") {
     const [subjData, classData, teacherData] = await prisma.$transaction([
        prisma.subject.findMany({ select: { id: true, name: true } }),
        prisma.class.findMany({ select: { id: true, name: true } }),
        prisma.teacher.findMany({ 
          select: { 
            id: true, 
            name: true, 
            surname: true, 
            subjects: { select: { id: true } },
            classes: { select: { id: true } }
          } 
        })
     ]);
     subjectsInfo = subjData;
     classesInfo = classData;
     teachersInfo = teacherData;
  }
  const relatedData = { subjects: subjectsInfo, classes: classesInfo, teachers: teachersInfo };

  const renderRow = (item: LessonList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.subject.name}</td>
      <td>{item.class.name}</td>
      <td className="hidden md:table-cell">{item.teacher.name + " " + item.teacher.surname}</td>  
      <td className="hidden lg:table-cell">{(item as any).room || "-"}</td>  
      <td className="hidden lg:table-cell">
         {item.day.slice(0, 3)} 
         {" " + new Date(item.startTime).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12: true })}
         {" - "}
         {new Date(item.endTime).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12: true })}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="lesson" type="update" data={item} relatedData={relatedData} />
              <FormModal table="lesson" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Lessons</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormModal table="lesson" type="create" relatedData={relatedData} />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination currentPage={currentPage} count={count} />
    </div>
  );
};

export default LessonListPage;