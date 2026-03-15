
"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState, Dispatch, SetStateAction, useActionState } from "react";

import {
  deleteClass,
  deleteExam,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteParent,
  deleteLesson,
  deleteAssignment,
  deleteResult,
  deleteAttendance,
  deleteEvent,
  deleteAnnouncement,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { FormContainerProps } from "./formContainer";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  parent: deleteParent,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  result: deleteResult,
  attendance: deleteAttendance,
  event: deleteEvent,
  announcement: deleteAnnouncement,
};

// USE LAZY LOADING

const TeacherForm = dynamic(() => import("./forms/teacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/studentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/subjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/classForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/examForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AssignmentForm = dynamic(() => import("./forms/assignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const forms: {
  [key: string]: (
    type: "create" | "update",
    data?: any,
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>,
    relatedData?: any
  ) => JSX.Element;
} = {
  teacher: (type, data, setOpen, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen!}
      relatedData={relatedData || { subjects: [] }}
    />
  ),
  student: (type, data, setOpen, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen!}
      relatedData={relatedData || { grades: [], classes: [] }}
    />
  ),
  parent: (type, data) => <div>Parent form not implemented yet</div>,
  subject: (type, data, setOpen, relatedData) => (
    // Always provide setOpen and a fallback empty object for relatedData
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen!}
      relatedData={relatedData || { teachers: [] }}
    />
  ),
  class: (type, data, setOpen, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen!}
      relatedData={relatedData || { teachers: [], grades: [] }}
    />
  ),
  lesson: (type, data) => <div>Lesson form not implemented yet</div>,
  exam: (type, data, setOpen, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen!}
      relatedData={relatedData || { lessons: [] }}
    />
  ),
  assignment: (type, data, setOpen, relatedData) => (
    <AssignmentForm
      type={type}
      data={data}
      setOpen={setOpen!}
      relatedData={relatedData || { lessons: [] }}
    />
  ),
  result: (type, data) => <div>Result form not implemented yet</div>,
  attendance: (type, data) => <div>Attendance form not implemented yet</div>,
  event: (type, data) => <div>Event form not implemented yet</div>,
  announcement: (type, data) => (
    <div>Announcement form not implemented yet</div>
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
        ? "bg-lamaSky"
        : "bg-lamaPurple";

  const [open, setOpen] = useState(false);
  const router = useRouter();

  const Form = () => {
    // The server actions expected signature is (currentState, formData).
    // The return type is Promise<{ success: boolean; error: boolean }>;
    // So initial state must match { success: boolean; error: boolean }
    const [state, formAction] = useActionState(deleteActionMap[table], {

      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast.success(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      }
    }, [state, router]);

    if (type === "delete" && id) {
      return (
        <form action={formAction} className="p-4 flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <span className="text-center font-medium">
            All data will be lost. Are you sure you want to delete this {table}?
          </span>
          <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
            Delete
          </button>
        </form>
      );
    } else if (type === "create" || type === "update") {
      return forms[table] ? (
        forms[table](type, data, setOpen, relatedData)
      ) : (
        <div className="p-4 text-center">Form for {table} is not implemented yet</div>
      );
    } else {
      return "Form not found!";
    }
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
