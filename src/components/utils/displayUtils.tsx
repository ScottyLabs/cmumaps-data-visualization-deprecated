import { twMerge } from "tailwind-merge";

// info-display
export const renderCell = (property: string, style?: string) => {
  return (
    <td className={twMerge("pr-4, style border pl-4", style)}>{property}</td>
  );
};

// side-panel
export const RED_BUTTON_STYLE = "bg-red-500 hover:bg-red-700";
