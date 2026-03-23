"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../inputField";
import { gradeSchema, GradeSchema } from "@/lib/formValidationsSchemas";
import { createGrade, updateGrade } from "@/lib/actions";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const GradeForm = ({
  type,
  data,
  setOpen,
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
  } = useForm<GradeSchema>({
    resolver: zodResolver(gradeSchema) as any,
  });
  const router = useRouter();
  const gradeAction = type === "create" ? createGrade : updateGrade;

  const onSubmit = handleSubmit(async (values) => {
    const state = await gradeAction(values);
    if (state.success) {
      setOpen(false);
      toast.success(`Grade has been ${type === "create" ? "created" : "updated"}!`);
      router.refresh();
    } else {
      toast.error(state.message || "Something went wrong!");
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new grade" : "Update the grade"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Grade Level"
          name="level"
          type="text"
          defaultValue={data?.level}
          register={register}
          error={errors?.level}
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
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default GradeForm;
