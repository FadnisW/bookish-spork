"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import InputField from "../inputField";
import { classSchema, ClassSchema } from "@/lib/formValidationsSchemas";
import { createClass, updateClass } from "@/lib/actions";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ClassForm = ({
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
        control,
        watch,
        formState: { errors },
    } = useForm<ClassSchema>({
        resolver: zodResolver(classSchema) as any,
        defaultValues: {
           ...data,
           teachers: data?.curriculum || []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "teachers",
    });

    const router = useRouter();
    const classAction = type === "create" ? createClass : updateClass;
    const teachers = relatedData?.teachers || [];
    const grades = relatedData?.grades || [];
    const subjects = relatedData?.subjects || [];

    const onSubmit = async (values: ClassSchema) => {
        await classAction(values);
        setOpen(false);
        toast(`Class has been ${type === "create" ? "created" : "updated"}!`);
        router.refresh();
    };

    return (
        <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
            <h1 className="text-xl font-semibold">
                {type === "create" ? "Create a new class" : "Update the class"}
            </h1>
            <div className="flex justify-between flex-wrap gap-4">
                <InputField
                    label="Class name"
                    name="name"
                    defaultValue={data?.name}
                    register={register}
                    error={errors?.name}
                />
                <InputField
                    label="Capacity"
                    name="capacity"
                    type="number"
                    defaultValue={data?.capacity?.toString()}
                    register={register}
                    error={errors?.capacity}
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
                    <label className="text-xs text-gray-500">Grade</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("gradeId")}
                        defaultValue={data?.gradeId}
                    >
                        <option value="">Select a grade</option>
                        {grades.map((grade: { id: number; level: number }) => (
                            <option value={grade.id} key={grade.id}>
                                Grade {grade.level}
                            </option>
                        ))}
                    </select>
                    {errors.gradeId?.message && (
                        <p className="text-xs text-red-400">
                            {errors.gradeId.message.toString()}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-xs text-gray-500">Supervisor</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("supervisorId")}
                        defaultValue={data?.supervisorId}
                    >
                        <option value="">Select a supervisor</option>
                        {teachers.map(
                            (teacher: { id: string; name: string; surname: string }) => (
                                <option value={teacher.id} key={teacher.id}>
                                    {teacher.name + " " + teacher.surname}
                                </option>
                            )
                        )}
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-2">
               <span className="text-xs text-gray-400 font-medium">Curriculum Assignments</span>
               {fields.map((field, index) => {
                   const watchedTeachers = watch("teachers");
                   const selectedSubjectId = watchedTeachers?.[index]?.subjectId;
                   const availableTeachers = selectedSubjectId 
                       ? teachers.filter((t: any) => t.subjects.some((ts: any) => ts.id === Number(selectedSubjectId)))
                       : teachers;

                   return (
                       <div key={field.id} className="flex gap-4 items-end border p-4 rounded-md">
                           <div className="flex flex-col gap-2 w-full md:w-1/2">
                               <label className="text-xs text-gray-500">Subject</label>
                               <select
                                   className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                                   {...register(`teachers.${index}.subjectId`)}
                                   defaultValue={field.subjectId}
                               >
                                   <option value="">Select Subject</option>
                                   {subjects.map((sub: any) => (
                                       <option value={sub.id} key={sub.id}>{sub.name}</option>
                                   ))}
                               </select>
                               {errors.teachers?.[index]?.subjectId?.message && (
                                   <p className="text-xs text-red-400">{errors.teachers[index].subjectId?.message?.toString()}</p>
                               )}
                           </div>
                           
                           <div className="flex flex-col gap-2 w-full md:w-1/2">
                               <label className="text-xs text-gray-500">Class Teacher</label>
                               <select
                                   className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                                   {...register(`teachers.${index}.teacherId`)}
                                   defaultValue={field.teacherId}
                                   disabled={!selectedSubjectId}
                               >
                                   <option value="">{selectedSubjectId ? "Select Teacher" : "Select Subject First"}</option>
                                   {availableTeachers.map((t: any) => (
                                       <option value={t.id} key={t.id}>{t.name} {t.surname}</option>
                                   ))}
                               </select>
                               {errors.teachers?.[index]?.teacherId?.message && (
                                   <p className="text-xs text-red-400">{errors.teachers[index].teacherId?.message?.toString()}</p>
                               )}
                           </div>
                           
                           <button type="button" onClick={() => remove(index)} className="bg-red-400 text-white p-2 text-xs rounded-md h-[38px] w-[80px]">
                              Remove
                           </button>
                       </div>
                   );
               })}
               <button type="button" onClick={() => append({ subjectId: undefined as any, teacherId: "" })} className="bg-lamaYellow text-black font-semibold p-2 rounded-md mt-2 w-max self-start text-xs border border-gray-300">
                   + Add Subject Curriculum
               </button>
            </div>

            <button className="bg-blue-400 text-white p-2 rounded-md mt-4">
                {type === "create" ? "Create" : "Update"}
            </button>
        </form>
    );
};

export default ClassForm;
