import { useSession } from "@clerk/nextjs";

import { useEffect, useState } from "react";
import { FiZoomIn } from "react-icons/fi";
import { FiZoomOut } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { extractBuildingCode } from "../../app/api/apiUtils";
import { AWS_API_INVOKE_URL } from "../../lib/apiRoutes";
import { useAppSelector } from "../../lib/hooks";
import { DEFAULT_PDF_SCALE_INDEX } from "../../settings";
import { PDFCoordinate } from "../shared/types";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  floorCode: string;
  scale: number;
  offset: PDFCoordinate;
}

const PDFViewer = ({ floorCode, scale, offset }: Props) => {
  const { session } = useSession();

  const showFile = useAppSelector((state) => state.visibility.showFile);

  const [pdfScaleIndex, setPdfScaleIndex] = useState(DEFAULT_PDF_SCALE_INDEX);
  const pdfScales = [1, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const pdfScale = pdfScales[pdfScaleIndex];
  scale /= pdfScale;

  const [pdfData, setPdfData] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (showFile && !pdfData) {
        const token = await session?.getToken();

        const buildingCode = extractBuildingCode(floorCode);

        const result = await fetch(`${AWS_API_INVOKE_URL}/get-floorplan`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method: "POST",
          body: JSON.stringify({
            filePath: `pdf/${buildingCode}/${floorCode}.pdf`,
          }),
        });

        const body = await result.json();

        if (!result.ok) {
          console.error(body.error);
          return;
        }

        setPdfData(body.data);
      }
    })();
    // No need to refetch the pdf when session refreshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorCode, pdfData, showFile]);

  const renderZoomInButton = () => {
    const disabled = pdfScaleIndex == pdfScales.length - 1;

    const zoomIn = () => {
      setPdfScaleIndex(pdfScaleIndex + 1);
    };

    return (
      <button onClick={zoomIn} disabled={disabled}>
        <FiZoomIn className={`size-7 ${disabled ? "text-gray-400" : ""}`} />
      </button>
    );
  };

  const renderZoomOutButton = () => {
    const disabled = pdfScaleIndex == 0;

    const zoomOut = () => {
      setPdfScaleIndex(pdfScaleIndex - 1);
    };

    return (
      <button onClick={zoomOut} disabled={disabled}>
        <FiZoomOut className={`size-7 ${disabled ? "text-gray-400" : ""}`} />
      </button>
    );
  };

  if (!pdfData || !showFile) {
    return;
  }

  return (
    <>
      <div className="absolute right-4 top-[3.75em] z-20 flex space-x-2 p-1">
        {renderZoomInButton()}
        {renderZoomOutButton()}
      </div>
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Document file={`data:application/pdf;base64,${pdfData}`}>
          <div className={"border border-gray-400"}>
            <Page pageNumber={1} scale={pdfScale} />
          </div>
        </Document>
      </div>
    </>
  );
};

export default PDFViewer;
