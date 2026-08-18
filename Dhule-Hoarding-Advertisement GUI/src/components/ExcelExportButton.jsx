import React from "react";
import * as XLSX from "xlsx";

const ExcelExportButton = ({
  tableHeaders, // Array of header strings (e.g., ['क्र.सं.', 'नाव'])
  data, // Array of objects (your fetched data)
  keyMapping, // Object: { 'क्र.सं.': 'srNo', 'नाव': 'name', ... }
  fileName = "export.xlsx",
  buttonText = "Excel",
  className = "btn btn-success btn-sm",
  iconClass = "bi bi-file-earmark-excel me-1",
  onError, // Optional callback for errors
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      const message = "No data available to export.";
      if (onError) onError(message);
      else alert(message);
      return;
    }

    try {
      // Build the 2D array: first row = headers
      const rows = [tableHeaders];

      // For each data item, map header → value using keyMapping
      data.forEach((item) => {
        const row = tableHeaders.map((header) => {
          const key = keyMapping[header];
          // If key exists, get the value; otherwise empty string
          return key && item.hasOwnProperty(key) ? item[key] : "";
        });
        rows.push(row);
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      // Trigger download
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Excel export failed:", error);
      const message = "Failed to generate Excel file.";
      if (onError) onError(message);
      else alert(message);
    }
  };

  return (
    <button className={className} onClick={handleExport}>
      <i className={iconClass}></i>
      {buttonText}
    </button>
  );
};

export default ExcelExportButton;
