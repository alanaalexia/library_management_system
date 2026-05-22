import React from "react";
import StudentHeader from "./StudentHeader";
import BooksManagement from "../../components/BooksManagement";

export default function StudentBooks() {
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white w-full">
      <StudentHeader />
      <BooksManagement mode="student" />
    </div>
  );
}