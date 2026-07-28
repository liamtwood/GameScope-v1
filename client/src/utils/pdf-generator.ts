// PDF generation is temporarily unavailable (jspdf removed due to CVE).
// This stub keeps the rest of the app compiling.

export async function generateMatchReportPDF(_elementId: string, _filename: string): Promise<void> {
  console.warn('PDF export is not available in this build.');
}
