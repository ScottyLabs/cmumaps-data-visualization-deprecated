"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PDFUpload = () => {
  const router = useRouter();

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.setAttribute("directory", "");
      ref.current.setAttribute("webkitdirectory", "");
      ref.current.setAttribute("mozdirectory", "");
    }
  }, [ref]);

  const [files, setFiles] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files) {
      alert("No file selected!");
      return;
    }

    for (const file of files) {
      // uploading the file
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const buffer = Buffer.from(uint8Array).toString("base64");

      const uploadResponse = await fetch("/api/uploadPDF", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          file: buffer,
        }),
      });

      if (uploadResponse.ok) {
        alert(`${file.name} uploaded successfully!`);
      } else {
        alert(`${file.name} upload failed!`);
      }
    }
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      {/* Back button */}
      <div className="absolute right-0 top-0 m-4">
        <Link href="/">
          <button className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-700">
            Back
          </button>
        </Link>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="rounded bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Upload PDF</h1>
        <input
          type="file"
          ref={ref}
          accept="application/pdf"
          onChange={handleFileChange}
          className="mb-4"
        />
        <button type="submit" className="rounded bg-blue-500 p-2 text-white">
          Upload
        </button>
      </form>
    </div>
  );
};

export default PDFUpload;
