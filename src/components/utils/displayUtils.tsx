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
