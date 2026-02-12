"""
OCR 결과 텍스트 확인 도구
"""

from ocr_processor import extract_text_with_fallback
from pdf_parser import merge_two_columns
import sys


def view_ocr_text(pdf_path, output_txt):
    """OCR 추출 텍스트를 파일로 저장"""
    print("OCR 텍스트 추출 중...")
    text_blocks = extract_text_with_fallback(pdf_path)
    
    if text_blocks:
        merged = merge_two_columns(text_blocks)
        
        with open(output_txt, 'w', encoding='utf-8') as f:
            f.write(merged)
        
        print(f"\n추출 완료: {output_txt}")
        print(f"총 {len(merged)} 문자")
        print("\n처음 1000자 미리보기:")
        print("=" * 60)
        print(merged[:1000])
        print("=" * 60)
    else:
        print("텍스트 추출 실패")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("사용법: python view_ocr_text.py <PDF파일> <출력TXT파일>")
    else:
        view_ocr_text(sys.argv[1], sys.argv[2])
