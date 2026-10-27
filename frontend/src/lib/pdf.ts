export async function downloadReportPDF(title: string, date: string): Promise<void> {
  const originalTitle = document.title;
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const targetFilename = `${sanitizedTitle}_${date}_report`;

  try {
    // Set document title so browsers use it as the default PDF export filename
    document.title = targetFilename;
    window.print();
  } finally {
    // Restore title shortly after print dialog completes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }
}
