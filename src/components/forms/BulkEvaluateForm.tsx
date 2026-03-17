"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveBulkResults } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { bulkResultSchema, BulkResultSchema } from "@/lib/formValidationsSchemas";

type StudentWithResult = {
  id: string;
  name: string;
  surname: string;
  resultId?: number;
  score?: number;
  feedback?: string;
};

const BulkEvaluateForm = ({
  students,
  examId,
  assignmentId,
}: {
  students: StudentWithResult[];
  examId?: number;
  assignmentId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Initialize form with fetched data
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BulkResultSchema>({
    resolver: zodResolver(bulkResultSchema) as any,
    defaultValues: {
      examId,
      assignmentId,
      results: students.map((s) => ({
        id: s.resultId,
        studentId: s.id,
        score: s.score || 0,
        feedback: s.feedback || "",
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "results",
  });

  const onSubmit = handleSubmit((data) => {
    // Filter out rows where score is 0 and no ID exists (meaning teacher just didn't touch it)
    const activeResults = data.results.filter((res: any) => res.id || res.score > 0 || res.feedback);

    if (activeResults.length === 0) {
      toast.info("No scores were entered to save.");
      return;
    }

    startTransition(async () => {
      const payload: BulkResultSchema = {
        examId: data.examId,
        assignmentId: data.assignmentId,
        results: activeResults,
      };

      const state = await saveBulkResults(payload);

      if (state.success) {
        toast.success("All grades saved successfully!");
        router.back();
      } else {
        toast.error((state as any).message || "Failed to save grades.");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="bg-white rounded-md p-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4 font-semibold">Student Name</th>
              <th className="p-4 font-semibold w-32">Score (0-100)</th>
              <th className="p-4 font-semibold">Feedback (Optional)</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const student = students[index];
              const rowErrors = errors.results?.[index];

              return (
                <tr
                  key={field.id}
                  className="border-b border-gray-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {student.name} {student.surname}
                      </span>
                      <span className="text-xs text-gray-500">ID: {student.id}</span>
                    </div>
                    {/* Hidden fields to keep track of associations */}
                    <input type="hidden" {...register(`results.${index}.id`)} />
                    <input type="hidden" {...register(`results.${index}.studentId`)} />
                  </td>
                  <td className="p-4 align-top">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...register(`results.${index}.score`, { valueAsNumber: true })}
                      className={`w-full ring-[1.5px] p-2 rounded-md text-sm outline-none focus:ring-lamaSky ${
                        rowErrors?.score ? "ring-red-400" : "ring-gray-300"
                      }`}
                    />
                    {rowErrors?.score && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {rowErrors.score.message}
                      </span>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <input
                      type="text"
                      placeholder="e.g. Needs improvement"
                      {...register(`results.${index}.feedback`)}
                      className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm outline-none focus:ring-lamaSky"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-md text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-lamaSky text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save All Grades"}
        </button>
      </div>
    </form>
  );
};

export default BulkEvaluateForm;
