import React from "react";
import LibrarianHeader from "./LibrarianHeader";
import BooksManagement from "../../components/BooksManagement";

export default function LibrarianBooks() {
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white w-full">
      <LibrarianHeader />
      <BooksManagement mode="librarian" />
    </div>
  );
}