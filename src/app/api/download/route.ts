import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { blocks = {}, format = 'pdf' } = body;

    if (!blocks || Object.keys(blocks).length === 0) {
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
    const marginTop = 72;
    const marginBottom = 72;

    let y = page.getHeight() - marginTop;

    const checkPageBreak = (neededHeight = lineHeight) => {
      if (y - neededHeight < marginBottom) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = page.getHeight() - marginTop;
      }
    };

    const drawRightAlignedBlock = (lines: string[], font: any, size: number) => {
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
    if (blocks.date) writerLines.push(blocks.date);

    if (writerLines.length > 0) {
      drawRightAlignedBlock(writerLines, helvetica, fontSize);
      y -= lineHeight * 2;
    }

    // === Receiver address - left-aligned ===
    if (blocks.receiver && blocks.receiver.length > 0) {
      blocks.receiver.forEach((line: string) => {
        checkPageBreak();
        page.drawText(line, { x: marginLeft, y, size: fontSize, font: helvetica, color: rgb(0, 0, 0) });
        y -= lineHeight;
      });
      y -= lineHeight * 2;
    }

    // === Salutation - left-aligned ===
    if (blocks.salutation) {
      checkPageBreak();
      page.drawText(blocks.salutation, { x: marginLeft, y, size: fontSize, font: helvetica, color: rgb(0, 0, 0) });
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
      page.drawLine({
        start: { x: x - 5, y },
        end: { x: x + textWidth + 5, y },
        thickness: 1.5,
        color: rgb(0, 0, 0)
      });
      y -= lineHeight * 2;
    }

    // === Body paragraphs ===
    if (blocks.paragraphs && blocks.paragraphs.length > 0) {
      blocks.paragraphs.forEach((p: string) => {
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
                color: rgb(0, 0, 0)
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
            color: rgb(0, 0, 0)
          });
          paragraphY -= lineHeight;
        }

        y = paragraphY;
      });
    }

    // === Closing & Signature - right-aligned ===
    if (blocks.closing || (blocks.signature && blocks.signature.length > 0)) {
      const closingLines: string[] = [];
      if (blocks.closing) closingLines.push(blocks.closing);
      if (blocks.signature && blocks.signature.length > 0) {
        closingLines.push(...blocks.signature);
      }
      if (closingLines.length > 0) {
        drawRightAlignedBlock(closingLines, helvetica, fontSize);
        y -= lineHeight;
      }
    }

    // FIX: Save as Uint8Array, convert to base64 string, send as JSON
    // This avoids Vercel binary response issues entirely
    const pdfBytes = await pdfDoc.save();
    const base64 = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({ base64, size: pdfBytes.length });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', detail: String(error) },
      { status: 500 }
    );
  }
}
