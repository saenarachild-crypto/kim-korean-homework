"""
PDF 진단 도구
PDF 파일의 구조와 내용을 분석
"""

import fitz  # PyMuPDF
import sys


def diagnose_pdf(pdf_path):
    """PDF 파일을 진단하고 상세 정보를 출력합니다."""
    print("=" * 60)
    print("PDF 진단 시작")
    print("=" * 60)
    
    try:
        doc = fitz.open(pdf_path)
        
        print(f"\n파일: {pdf_path}")
        print(f"페이지 수: {len(doc)}")
        print(f"암호화 여부: {doc.is_encrypted}")
        print(f"메타데이터: {doc.metadata}")
        
        for page_num, page in enumerate(doc):
            print(f"\n--- 페이지 {page_num + 1} ---")
            print(f"크기: {page.rect.width} x {page.rect.height}")
            
            # 텍스트 추출 시도 (다양한 방법)
            text_normal = page.get_text()
            text_dict = page.get_text("dict")
            text_blocks = page.get_text("blocks")
            
            print(f"\n일반 텍스트 추출 (길이: {len(text_normal)}자):")
            if text_normal.strip():
                print(text_normal[:500])  # 처음 500자만 표시
            else:
                print("  [텍스트 없음]")
            
            print(f"\n블록 수: {len(text_blocks)}")
            if text_blocks:
                print("첫 3개 블록:")
                for i, block in enumerate(text_blocks[:3]):
                    if len(block) >= 5:  # 텍스트 블록
                        print(f"  블록 {i}: {block[4][:100]}")
            
            print(f"\n딕셔너리 블록 수: {len(text_dict.get('blocks', []))}")
            
            # 이미지 확인
            images = page.get_images()
            print(f"\n이미지 수: {len(images)}")
            if images:
                print("  → 이미지 기반 PDF일 수 있음 (OCR 필요)")
        
        doc.close()
        
        print("\n" + "=" * 60)
        print("진단 완료")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python diagnose_pdf.py <PDF_파일>")
    else:
        diagnose_pdf(sys.argv[1])
