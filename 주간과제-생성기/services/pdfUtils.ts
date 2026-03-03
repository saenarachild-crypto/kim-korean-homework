import { PDFDocument } from 'pdf-lib';

// 청크당 최대 페이지 수 (수능 한 지문 평균 3~5페이지)
const MAX_PAGES_PER_CHUNK = 5;

/**
 * PDF 페이지 수가 많으면 자동으로 페이지 단위 청크로 분할합니다.
 */
export async function splitPdfIfNeeded(file: File): Promise<File[]> {
  if (file.type !== 'application/pdf') return [file];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    // 페이지 수가 청크 한계 이하이면 원본 반환
    if (totalPages <= MAX_PAGES_PER_CHUNK) return [file];

    const baseName = file.name.replace(/\.pdf$/i, '');
    const totalParts = Math.ceil(totalPages / MAX_PAGES_PER_CHUNK);
    const chunks: File[] = [];

    for (let partIdx = 0; partIdx < totalParts; partIdx++) {
      const startPage = partIdx * MAX_PAGES_PER_CHUNK;
      const endPage = Math.min(startPage + MAX_PAGES_PER_CHUNK, totalPages);

      const chunkDoc = await PDFDocument.create();
      const pageIndices = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
      const copiedPages = await chunkDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach(page => chunkDoc.addPage(page));

      const chunkBytes = await chunkDoc.save();
      const chunkFile = new File(
        [chunkBytes],
        `${baseName}_part${partIdx + 1}of${totalParts}.pdf`,
        { type: 'application/pdf' }
      );
      chunks.push(chunkFile);
    }

    return chunks;
  } catch (e) {
    // 분할 실패 시 원본 파일로 폴백
    console.warn(`PDF 자동 분할 실패 (${file.name}), 원본 사용:`, e);
    return [file];
  }
}
