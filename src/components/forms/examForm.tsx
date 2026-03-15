"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../inputField";
import { Dispatch, SetStateAction } from "react";
import { examSchema, ExamSchema } from "@/lib/formValidationsSchemas";
import { createExam, updateExam } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ExamForm = ({
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
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema) as any,
  });
  const router = useRouter();
  const examAction = type === "create" ? createExam : updateExam;
  const lessons = relatedData?.lessons || [];

  const onSubmit = handleSubmit(async (values) => {
    const state = await examAction(values);
    if (state.success) {
      setOpen(false);
      toast.success(
        `Exam has been ${type === "create" ? "created" : "updated"}!`
      );
      router.refresh();
    } else {
      toast.error(
        (state as any).message || "Failed to save exam."
      );
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new exam" : "Update the exam"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Exam Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Start Date & Time"
          name="startTime"
          type="datetime-local"
          defaultValue={
            data?.startTime
              ? new Date(data.startTime).toISOString().slice(0, 16)
              : ""
          }
          register={register}
          error={errors?.startTime}
        />
        <InputField
          label="End Date & Time"
          name="endTime"
          type="datetime-local"
          defaultValue={
            data?.endTime
              ? new Date(data.endTime).toISOString().slice(0, 16)
              : ""
          }
          register={register}
          error={errors?.endTime}
        />
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
            defaultValue={data?.lessonId}
          >
            <option value="">Select a lesson</option>
            {lessons.map(
              (lesson: {
                id: number;
                name: string;
                subject: { name: string };
                class: { name: string };
                teacher: { name: string; surname: string };
              }) => (
                <option value={lesson.id} key={lesson.id}>
                  {lesson.subject.name} - {lesson.class.name} (
                  {lesson.teacher.name} {lesson.teacher.surname})
                </option>
              )
            )}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">
              {errors.lessonId.message.toString()}
            </p>
          )}
        </div>
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;