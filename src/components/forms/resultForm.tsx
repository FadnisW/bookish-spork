"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../inputField";
import { Dispatch, SetStateAction } from "react";
import { resultSchema, ResultSchema } from "@/lib/formValidationsSchemas";
import { createResult, updateResult } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ResultForm = ({
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
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema) as any,
  });
  const router = useRouter();
  const resultAction = type === "create" ? createResult : updateResult;

  const students = relatedData?.students || [];
  const exams = relatedData?.exams || [];
  const assignments = relatedData?.assignments || [];

  const onSubmit = handleSubmit(async (values, event) => {
    // Determine whether the assessmentId string is an exam or assignment
    const formData = new FormData(event?.target as HTMLFormElement);
    const assessmentValue = formData.get("assessmentId") as string;
    let examId: number | undefined;
    let assignmentId: number | undefined;

    if (assessmentValue) {
      if (assessmentValue.startsWith("exam_")) {
        examId = parseInt(assessmentValue.replace("exam_", ""));
      } else if (assessmentValue.startsWith("assignment_")) {
        assignmentId = parseInt(assessmentValue.replace("assignment_", ""));
      }
    }

    const payload = { ...values, examId, assignmentId };
    
    // We don't send assessmentId natively to Prisma, it's just a UI form merger
    delete (payload as any).assessmentId;

    const state = await resultAction(payload);
    if (state.success) {
      setOpen(false);
      toast.success(
        `Result has been ${type === "create" ? "created" : "updated"}!`
      );
      router.refresh();
    } else {
      toast.error(
        (state as any).message || "Failed to save result."
      );
    }
  });

  // Calculate default assessment value for Updates
  let defaultAssessment = "";
  if (data?.examId) defaultAssessment = `exam_${data.examId}`;
  if (data?.assignmentId) defaultAssessment = `assignment_${data.assignmentId}`;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new result" : "Update the result"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Score"
          name="score"
          type="number"
          defaultValue={data?.score}
          register={register}
          error={errors?.score}
        />
        <InputField
          label="Feedback (Optional)"
          name="feedback"
          defaultValue={data?.feedback}
          register={register}
          error={errors?.feedback}
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
        
        {/* Student Dropdown */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Student</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("studentId")}
            defaultValue={data?.studentId}
          >
            <option value="">Select a student</option>
            {students.map((student: { id: string; name: string; surname: string }) => (
              <option value={student.id} key={student.id}>
                {student.name} {student.surname}
              </option>
            ))}
          </select>
          {errors.studentId?.message && (
            <p className="text-xs text-red-400">
              {errors.studentId.message.toString()}
            </p>
          )}
        </div>

        {/* Assessment Dropdown (Merges Exams and Assignments) */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Assessment</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            name="assessmentId"
            defaultValue={defaultAssessment}
          >
            <option value="">Select an assessment</option>
            
            {exams.length > 0 && <optgroup label="Exams">
              {exams.map((exam: any) => (
                <option value={`exam_${exam.id}`} key={`exam_${exam.id}`}>
                  {exam.title} - {exam.lesson?.subject?.name || "Subject"} ({exam.lesson?.teacher?.name} {exam.lesson?.teacher?.surname})
                </option>
              ))}
            </optgroup>}

            {assignments.length > 0 && <optgroup label="Assignments">
              {assignments.map((assignment: any) => (
                <option value={`assignment_${assignment.id}`} key={`assignment_${assignment.id}`}>
                  {assignment.title} - {assignment.lesson?.subject?.name || "Subject"} ({assignment.lesson?.teacher?.name} {assignment.lesson?.teacher?.surname})
                </option>
              ))}
            </optgroup>}
          </select>
          {!defaultAssessment && (errors.examId?.message || errors.assignmentId?.message) && (
            <p className="text-xs text-red-400">
              Assessment is required!
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

export default ResultForm;
