"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../inputField";
import { Dispatch, SetStateAction } from "react";
import { lessonSchema, LessonSchema } from "@/lib/formValidationsSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const LessonForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema) as any,
  });
  const router = useRouter();
  const lessonAction = type === "create" ? createLesson : updateLesson;

  const allSubjects = relatedData?.subjects || [];
  const allClasses = relatedData?.classes || [];
  const teachers = relatedData?.teachers || [];

  const selectedTeacherId = watch("teacherId");
  const selectedClassId = watch("classId");

  const selectedTeacherDbObj = selectedTeacherId 
     ? teachers.find((t: any) => t.id === selectedTeacherId)
     : null;

  const subjects = selectedTeacherDbObj 
    ? allSubjects.filter((s: any) => selectedTeacherDbObj.subjects.some((ts: any) => ts.id === s.id))
    : [];
    
  const classes = selectedTeacherDbObj 
    ? allClasses.filter((c: any) => selectedTeacherDbObj.classes.some((tc: any) => tc.id === c.id))
    : [];

  const onSubmit = handleSubmit(async (values: any) => {

    const state = await lessonAction(values);
    if (state.success) {
      setOpen(false);
      toast.success(
        `Lesson has been ${type === "create" ? "created" : "updated"}!`
      );
      router.refresh();
    } else {
      toast.error((state as any).message || "Failed to save lesson.");
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Lesson" : "Update Lesson"}
      </h1>
      
      <span className="text-xs text-gray-400 font-medium">Logistics</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Lesson Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Day of Week</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("day")}
            defaultValue={data?.day}
          >
            <option value="">Select a day</option>
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
          </select>
          {errors.day?.message && (
            <p className="text-xs text-red-400">{errors.day.message.toString()}</p>
          )}
        </div>
        
        <InputField
          label="Start Time"
          name="startTime"
          type="time"
          defaultValue={
            data?.startTime
              ? new Date(data.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : ""
          }
          register={register as any}
          error={errors?.startTime}
        />
        <InputField
          label="End Time"
          name="endTime"
          type="time"
          defaultValue={
            data?.endTime
              ? new Date(data.endTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : ""
          }
          register={register as any}
          error={errors?.endTime}
        />
      </div>

      <span className="text-xs text-gray-400 font-medium">Relations</span>
      <div className="flex justify-between flex-wrap gap-4">
        {/* Number 1: Teacher */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Teacher</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teacherId")}
            defaultValue={data?.teacherId}
          >
            <option value="">Select a teacher</option>
            {teachers.map((teacher: { id: string; name: string; surname: string }) => (
              <option value={teacher.id} key={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>
          )}
        </div>

        {/* Number 2: Class (Depends on Teacher) */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
            {...register("classId")}
            defaultValue={data?.classId}
            disabled={!selectedTeacherId}
          >
            <option value="">{selectedTeacherId ? "Select a class" : "Select Teacher first"}</option>
            {classes.map((cls: { id: number; name: string }) => (
              <option value={cls.id} key={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>
          )}
        </div>

        {/* Number 3: Subject (Depends on Class) */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subject</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
            {...register("subjectId")}
            defaultValue={data?.subjectId}
            disabled={!selectedClassId}
          >
            <option value="">{selectedClassId ? "Select a subject" : "Select Class first"}</option>
            {subjects.map((subject: { id: number; name: string }) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId?.message && (
            <p className="text-xs text-red-400">{errors.subjectId.message.toString()}</p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">Resources & Metadata</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Room"
          name="room"
          defaultValue={data?.room}
          register={register}
          error={errors?.room}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonType")}
            defaultValue={data?.lessonType || "LECTURE"}
          >
            <option value="LECTURE">Lecture</option>
            <option value="LAB">Lab</option>
            <option value="SEMINAR">Seminar</option>
          </select>
          {errors.lessonType?.message && (
            <p className="text-xs text-red-400">{errors.lessonType.message.toString()}</p>
          )}
        </div>
        
        {type === "update" && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Status</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("status")}
              defaultValue={data?.status || "ACTIVE"}
            >
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="SUBSTITUTED">Substituted</option>
            </select>
            {errors.status?.message && (
              <p className="text-xs text-red-400">{errors.status.message.toString()}</p>
            )}
          </div>
        )}

      </div>
      {data && (
        <InputField
          label="Id"
          name="id"
          type="hidden"
          defaultValue={data?.id?.toString?.()}
          register={register}
          error={errors?.id}
        />
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md mt-4">
        {type === "create" ? "Create Schedule Matrix" : "Update Matrix"}
      </button>
    </form>
  );
};

export default LessonForm;
