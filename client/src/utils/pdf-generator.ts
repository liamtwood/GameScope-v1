import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateMatchReportPDF(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Temporarily show the element if it's hidden
    const originalDisplay = element.style.display;
    element.style.display = 'block';

    // Wait for charts and images to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force SVG elements to be rendered properly
    const svgElements = element.querySelectorAll('svg');
    svgElements.forEach(svg => {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    });

    // Additional delay for SVG processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate canvas from HTML
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      logging: true, // Enable logging for debugging
      onclone: (clonedDoc) => {
        // Ensure all images are loaded in the cloned document
        const images = clonedDoc.querySelectorAll('img');
        return Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }));
      }
    });

    // Restore original display
    element.style.display = originalDisplay;

    // Calculate dimensions for PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}