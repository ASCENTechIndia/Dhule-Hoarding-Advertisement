import { pdf } from "@react-pdf/renderer";
import { PanchanamaPDF } from "../components/PanchanamaPDF";

export const generatePDF = async (data) => {
  const blob = await pdf(<PanchanamaPDF data={data} />).toBlob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Panchanama_${data.master.NUM_ILLEGALHOARD_ID || "details"}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
