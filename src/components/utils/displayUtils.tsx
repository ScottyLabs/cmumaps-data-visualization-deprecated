import { twMerge } from "tailwind-merge";

// info-display
export const renderCell = (property, style?) => {
  return (
    <td className={`border pl-4 pr-4 ${style?.bold ? "font-bold" : ""}`}>
      {property}
    </td>
  );
};

// side-panel
export const RED_BUTTON_STYLE = "bg-red-500 hover:bg-red-700";

export const renderSidePanelButton = (text, handleClick, style?) => {
  return (
    <button
      className={twMerge(
        "text-nowrap rounded bg-blue-500 px-4 py-2 text-sm font-bold text-emerald-200 hover:bg-blue-700",
        style
      )}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};
