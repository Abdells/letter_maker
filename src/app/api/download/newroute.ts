import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Download API received:', body);

    let fullContent = body.fullContent || '';

    // Fallback if content is missing
    if (!fullContent.trim()) {
      fullContent = `Dear Sir/Madam,

This is a fallback letter because the content was not received properly.

Please try generating the preview again.

Yours faithfully,
[Your Name]`;
    }

    // Create A4 PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 12;
    const lineHeight = 18;
    const marginLeft = 72;      // left margin ~2.54cm
    const marginRight = 72;     // right margin ~2.54cm
    const marginTop = 72;       // top margin ~2.54cm (reduced from 108)
    const marginBottom = 72;

    let y = page.getHeight() - marginTop;

    // Split content into lines
    const lines = fullContent.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        y -= lineHeight;
        if (y < marginBottom) {
          page = pdfDoc.addPage(PageSizes.A4);
          y = page.getHeight() - marginTop;
        }
        continue;
      }

      let currentFont = helvetica;
      let currentSize = fontSize;
      let x = marginLeft; // default left

      // Title: bold, larger, centered
      if (line.toUpperCase() === line || line.startsWith('RE:') || line.startsWith('APPLICATION')) {
        currentFont = helveticaBold;
        currentSize = fontSize * 1.2;
        const textWidth = currentFont.widthOfTextAtSize(line, currentSize);
        x = (page.getWidth() - textWidth) / 2;
      }

      // Writer address, date, closing, signature: right-aligned
      if (
        line.includes('P.O. BOX') || line.includes('BOX') || 
        line.includes('Date:') ||
        line.startsWith('Yours') || line.startsWith('Sincerely') || line.startsWith('Faithfully') ||
        line.startsWith('Best regards') || line.startsWith('Regards')
      ) {
        const textWidth = currentFont.widthOfTextAtSize(line, currentSize);
        x = page.getWidth() - marginRight - textWidth;
      }

      // Word wrap
      const maxWidth = page.getWidth() - marginLeft - marginRight;
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (currentFont.widthOfTextAtSize(testLine, currentSize) > maxWidth) {
          page.drawText(currentLine, { x, y, size: currentSize, font: currentFont, color: rgb(0, 0, 0) });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, { x, y, size: currentSize, font: currentFont, color: rgb(0, 0, 0) });
        y -= lineHeight;
      }

      if (y < marginBottom) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = page.getHeight() - marginTop;
      }
    }

    const pdfBytes = await pdfDoc.save();
    console.log('PDF generated - size:', pdfBytes.length, 'bytes');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBytes.length.toString(),
        'Content-Disposition': 'attachment; filename="letter.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}