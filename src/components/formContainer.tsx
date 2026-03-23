import React from 'react'
import FormModal from './formModal';


export type FormContainerProps = {
    table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "schoolException"
    | "grade";
    type: "create" | "update" | "delete";
    data?: any;
    id?: number | string;
    relatedData?: any;
};

const FormContainer = ({
    table,
    type,
    data,
    id,
    relatedData,
}: FormContainerProps) => {
    return (
        <div className="">
            <FormModal
                table={table}
                type={type}
                data={data}
                id={id}
                relatedData={relatedData}
            />
        </div>
    );
};

export default FormContainer;
