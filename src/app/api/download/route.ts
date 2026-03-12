import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Download API received blocks:', body.blocks);

    const { blocks = {}, format = 'pdf' } = body;

    if (!blocks || Object.keys(blocks).length === 0) {
      console.log('No blocks received - returning error');
      return NextResponse.json({ error: 'No letter blocks provided' }, { status: 400 });
    }

    if (format !== 'pdf') {
      return NextResponse.json({ error: 'Only PDF supported for now' }, { status: 400 });
    }

    // Create A4 PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 12;
    const lineHeight = 18;
    const marginLeft = 72;
    const marginRight = 72;
    const marginTop = 72;     // Slightly more top margin for formal feel
    const marginBottom = 72;

    let y = page.getHeight() - marginTop;
    //check if we have enough space for the next block, if not add a new page
    const checkPageBreak = (neededHeight = lineHeight) => {
  if (y - neededHeight < marginBottom) {
    page = pdfDoc.addPage(PageSizes.A4);
    y = page.getHeight() - marginTop;
  }
};

    // Helper: Draw a right-aligned block with left-aligned lines (consistent left edge)
    const drawRightAlignedBlock = (lines, font, size) => {
  if (!lines || lines.length === 0) return;

  let maxWidth = 0;
  lines.forEach(line => {
    const width = font.widthOfTextAtSize(line, size);
    if (width > maxWidth) maxWidth = width;
  });

  const blockRight = page.getWidth() - marginRight;

  lines.forEach(line => {
    checkPageBreak();

    const x = blockRight - maxWidth;
    page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
  });
};

    // === Writer address + Date block - right-aligned ===
    const writerLines = [...(blocks.writer || [])];
    if (blocks.date) writerLines.push(blocks.date); // Add date to writer block

    if (writerLines.length > 0) {
      drawRightAlignedBlock(writerLines, helvetica, fontSize);
      y -= lineHeight * 2; // Extra space after writer/date block
    }

    // === Receiver address - left-aligned ===
    if (blocks.receiver && blocks.receiver.length > 0) {
      blocks.receiver.forEach(line => {
        checkPageBreak();
        page.drawText(line, { x: marginLeft, y, size: fontSize, font: helvetica, color: rgb(0,0,0) });
        y -= lineHeight;
      });
      y -= lineHeight * 2; // Extra space after receiver
    }

    // === Salutation - left-aligned ===
    if (blocks.salutation) {
      checkPageBreak();
      page.drawText(blocks.salutation, { x: marginLeft, y, size: fontSize, font: helvetica, color: rgb(0,0,0) });
      y -= lineHeight * 1.5;
    }

    // === Title - bold, centered, uppercase, underlined ===
    if (blocks.title) {
      const titleText = blocks.title.toUpperCase();
      const titleSize = fontSize * 1.25;
      const textWidth = helveticaBold.widthOfTextAtSize(titleText, titleSize);
      const x = (page.getWidth() - textWidth) / 2;
      checkPageBreak(lineHeight * 2);
      page.drawText(titleText, { x, y, size: titleSize, font: helveticaBold, color: rgb(0, 0, 0) });
      y -= lineHeight / 2;
      // Underline (thicker and centered)
      page.drawLine({
        start: { x: x - 5, y },
        end: { x: x + textWidth + 5, y },
        thickness: 1.5,
        color: rgb(0, 0, 0)
      });
      y -= lineHeight * 2;
    }

    // === Body paragraphs - left-aligned, spaced ===
    if (blocks.paragraphs && blocks.paragraphs.length > 0) {
      blocks.paragraphs.forEach(p => {
        const maxWidth = page.getWidth() - marginLeft - marginRight;
        const words = p.split(' ');
        let currentLine = '';
        let paragraphY = y;

       for (const word of words) {
  const testLine = currentLine ? currentLine + ' ' + word : word;

  if (helvetica.widthOfTextAtSize(testLine, fontSize) > maxWidth) {

    if (currentLine) {

      if (paragraphY - lineHeight < marginBottom) {
        page = pdfDoc.addPage(PageSizes.A4);
        paragraphY = page.getHeight() - marginTop;
      }

      page.drawText(currentLine, {
        x: marginLeft,
        y: paragraphY,
        size: fontSize,
        font: helvetica,
        color: rgb(0,0,0)
      });

      paragraphY -= lineHeight;
    }

    currentLine = word;

  } else {
    currentLine = testLine;
  }
}

if (currentLine) {

  if (paragraphY - lineHeight < marginBottom) {
    page = pdfDoc.addPage(PageSizes.A4);
    paragraphY = page.getHeight() - marginTop;
  }

  page.drawText(currentLine, {
    x: marginLeft,
    y: paragraphY,
    size: fontSize,
    font: helvetica,
    color: rgb(0,0,0)
  });

  paragraphY -= lineHeight;
}

y = paragraphY //- lineHeight * 1.5; // Extra spacing between paragraphs
});
}

// === Closing & Signature - right-aligned block ===
if (blocks.closing || (blocks.signature && blocks.signature.length > 0)) {
  const closingLines = [];
  if (blocks.closing) closingLines.push(blocks.closing);
  if (blocks.signature && blocks.signature.length > 0) {
    closingLines.push(...blocks.signature);
  }
  if (closingLines.length > 0) {
    drawRightAlignedBlock(closingLines, helvetica, fontSize);
    y -= lineHeight;
  }
}

const pdfBytes = await pdfDoc.save();
const buffer = Buffer.from(pdfBytes);

console.log('PDF generated - size:', buffer.length, 'bytes');

return new NextResponse(buffer, {
  status: 200,
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="letter.pdf"',
    'Content-Length': buffer.length.toString(),
  },
});
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}