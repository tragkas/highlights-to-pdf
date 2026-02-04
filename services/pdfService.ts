
import * as pdfjs from 'pdfjs-dist';
import { ExtractionResult, HighlightedItem } from "../types";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

/**
 * Checks if two rectangles overlap.
 * PDF.js rects are [x1, y1, x2, y2]
 */
const isOverlapping = (annotRect: number[], textRect: { x: number, y: number, w: number, h: number }) => {
  const [aX1, aY1, aX2, aY2] = annotRect;
  
  // Normalize annotation rect (ensure x1 < x2 and y1 < y2)
  const minX = Math.min(aX1, aX2);
  const maxX = Math.max(aX1, aX2);
  const minY = Math.min(aY1, aY2);
  const maxY = Math.max(aY1, aY2);

  // Text rect
  const tX1 = textRect.x;
  const tY1 = textRect.y;
  const tX2 = textRect.x + textRect.w;
  const tY2 = textRect.y + textRect.h;

  return (minX < tX2 && maxX > tX1 && minY < tY2 && maxY > tY1);
};

export const extractHighlightsLocally = async (arrayBuffer: ArrayBuffer): Promise<ExtractionResult> => {
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const highlights: HighlightedItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const annotations = await page.getAnnotations();
    const textContent = await page.getTextContent();
    
    // Filter for highlight annotations
    const highlightAnnots = annotations.filter(
      (annot: any) => annot.subtype === 'Highlight' || annot.type === 'Highlight'
    );

    if (highlightAnnots.length === 0) continue;

    // Process each text item on the page once to get its bounds
    const textItems = textContent.items
      .filter((item: any) => item.str && item.str.trim().length > 0)
      .map((item: any) => {
        // item.transform is [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const tx = item.transform;
        return {
          str: item.str,
          dir: item.dir,
          width: item.width,
          height: item.height,
          x: tx[4],
          y: tx[5],
          w: item.width,
          h: item.height
        };
      });

    for (const annot of highlightAnnots) {
      let extractedText = "";

      // Strategy 1: Check if content is already in the metadata
      if (annot.contents && annot.contents.trim().length > 0) {
        extractedText = annot.contents;
      } else {
        // Strategy 2: Coordinate-based matching
        // PDF highlights often have 'rect' [x1, y1, x2, y2]
        // Some also have 'quadPoints' for multi-line highlights
        const overlappingText = textItems
          .filter(item => isOverlapping(annot.rect, item))
          .map(item => item.str)
          .join(" ")
          .replace(/\s+/g, ' ')
          .trim();
        
        extractedText = overlappingText || "Highlight detected (Text unreadable or hidden)";
      }

      if (extractedText) {
        highlights.push({
          text: extractedText,
          page: i,
          color: annot.color ? `rgb(${annot.color.join(',')})` : undefined
        });
      }
    }
  }

  return {
    highlights,
    summary: `Local analysis complete. Scanned ${pdf.numPages} pages and found ${highlights.length} highlights using spatial coordinate mapping.`
  };
};
