"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../inputField";
import { schoolExceptionSchema, SchoolExceptionSchema } from "@/lib/formValidationsSchemas";
import { createSchoolException } from "@/lib/actions";
import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const SchoolExceptionForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolExceptionSchema>({
    resolver: zodResolver(schoolExceptionSchema) as any,
  });

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    startTransition(async () => {
      const res = await createSchoolException(formData);
      if (res.success) {
        toast.success("School Exception successfully recorded!");
        setOpen(false);
        router.refresh();
      } else if (res.error && res.message) {
        toast.error(res.message);
      }
    });
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        Declare Global Exception / Holiday
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Start Date"
          name="startDate"
          defaultValue={data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ""}
          register={register}
          error={errors.startDate}
          type="date"
        />
        <InputField
          label="End Date"
          name="endDate"
          defaultValue={data?.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ""}
          register={register}
          error={errors.endDate}
          type="date"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Reason / Note</label>
        <textarea
          rows={3}
          {...register("reason")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full outline-none focus:ring-lamaPurple"
          placeholder="e.g. Winter Break, Snow Closure, Public Holiday..."
        />
        {errors.reason?.message && (
          <p className="text-xs text-red-500">{errors.reason.message.toString()}</p>
        )}
      </div>

      <button
        disabled={isPending}
        className="bg-blue-600 shadow-md text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isPending ? "Saving..." : type === "create" ? "Declare Exception" : "Update Exception"}
      </button>
    </form>
  );
};

export default SchoolExceptionForm;
