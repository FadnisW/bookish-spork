"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useState } from "react";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationsSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "../inputField";

type TargetType = "general" | "class" | "teacher" | "student";

const AnnouncementForm = ({
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
    setValue,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: data
      ? {
          id: data.id,
          title: data.title,
          description: data.description,
          date: data.date ? new Date(data.date) : undefined,
          classId: data.classId ?? undefined,
          teacherId: data.teacherId ?? undefined,
          studentId: data.studentId ?? undefined,
        }
      : {},
  });

  const router = useRouter();
  const announcementAction = type === "create" ? createAnnouncement : updateAnnouncement;

  const classes = relatedData?.classes || [];
  const teachers = relatedData?.teachers || [];
  const students = relatedData?.students || [];

  const getInitialTarget = (): TargetType => {
    if (data?.teacherId) return "teacher";
    if (data?.studentId) return "student";
    if (data?.classId) return "class";
    return "general";
  };

  const [targetType, setTargetType] = useState<TargetType>(getInitialTarget);

  const handleTargetChange = (newTarget: TargetType) => {
    setTargetType(newTarget);
    setValue("classId", undefined);
    setValue("teacherId", undefined);
    setValue("studentId", undefined);
  };

  const toDateInput = (date?: Date | string) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const onSubmit = handleSubmit(async (values: any) => {
    // Zero out unused targeting fields
    if (targetType !== "class") values.classId = undefined;
    if (targetType !== "teacher") values.teacherId = undefined;
    if (targetType !== "student") values.studentId = undefined;

    const state = await announcementAction(values);
    if (state.success) {
      toast.success(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Announcement" : "Update Announcement"}
      </h1>

      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      {/* Core Details */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Announcement Details</span>
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
        />
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Description / Message</label>
          <textarea
            {...register("description")}
            rows={4}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-none"
            placeholder="Write your announcement here..."
          />
          {errors.description && (
            <p className="text-xs text-red-400">{errors.description.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            defaultValue={toDateInput(data?.date)}
            {...register("date")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
          />
          {errors.date && (
            <p className="text-xs text-red-400">{errors.date.message?.toString()}</p>
          )}
        </div>
      </div>

      {/* Audience Targeting */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Audience</span>
        <div className="flex gap-2 flex-wrap">
          {(["general", "class", "teacher", "student"] as TargetType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTargetChange(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                targetType === t
                  ? "bg-lamaPurple border-lamaPurple text-white"
                  : "bg-white border-gray-300 text-gray-500 hover:border-lamaPurple"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {targetType === "class" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Select Class</label>
            <select
              {...register("classId")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
            >
              <option value="">-- Choose a Class --</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {targetType === "teacher" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Select Teacher</label>
            <select
              {...register("teacherId")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
            >
              <option value="">-- Choose a Teacher --</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} {t.surname}</option>
              ))}
            </select>
          </div>
        )}

        {targetType === "student" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Select Student</label>
            <select
              {...register("studentId")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
            >
              <option value="">-- Choose a Student --</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} {s.surname}</option>
              ))}
            </select>
          </div>
        )}

        {targetType === "general" && (
          <p className="text-xs text-gray-400 italic">This announcement will be visible to everyone.</p>
        )}
      </div>

      <button
        type="submit"
        className="bg-lamaPurple text-white py-2 px-4 rounded-md border-none w-max self-end font-medium"
      >
        {type === "create" ? "Create Announcement" : "Update Announcement"}
      </button>
    </form>
  );
};

export default AnnouncementForm;
