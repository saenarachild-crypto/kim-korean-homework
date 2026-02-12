"""
이미지 기반 PDF OCR 처리 모듈
Tesseract OCR을 사용하여 이미지에서 텍스트 추출
"""

import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import io
import os
from typing import List, Dict

# Tesseract 경로 설정 (Windows)
if os.name == 'nt':  # Windows
    possible_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Users\saena\AppData\Local\Programs\Tesseract-OCR\tesseract.exe',
    ]
    for path in possible_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            print(f"Tesseract 경로 설정: {path}")
            break


def extract_text_from_image_pdf(pdf_path: str, lang: str = 'kor+eng') -> List[Dict]:
    """
    이미지 기반 PDF에서 OCR로 텍스트를 추출합니다.
    
    Args:
        pdf_path: PDF 파일 경로
        lang: Tesseract 언어 설정 (기본값: 'kor+eng')
        
    Returns:
        List[dict]: [{"text": str, "x": float, "y": float, "page": int}, ...]
    """
    text_blocks = []
    
    try:
        doc = fitz.open(pdf_path)
        
        for page_num, page in enumerate(doc):
            print(f"  페이지 {page_num + 1}/{len(doc)} OCR 처리 중...")
            
            # 페이지를 이미지로 변환 (DPI 높일수록 정확도 증가)
            mat = fitz.Matrix(2.0, 2.0)  # 2배 확대
            pix = page.get_pixmap(matrix=mat)
            
            # PIL Image로 변환
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Tesseract OCR 실행 - 전체 텍스트로 추출
            try:
                # 한국어+영어로 텍스트 추출
                text = pytesseract.image_to_string(
                    img,
                    lang=lang,
                    config='--psm 6'  # PSM 6: Assume a single uniform block of text
                )
                
                if text.strip():
                    # 추출된 텍스트를 줄 단위로 분리
                    lines = text.strip().split('\n')
                    for i, line in enumerate(lines):
                        if line.strip():
                            text_blocks.append({
                                "text": line.strip(),
                                "x": 0,  # 전체 텍스트 추출이므로 x 좌표는 근사치
                                "y": i * 20,  # 줄 번호 기반 y 좌표 근사치
                                "page": page_num
                            })
            
            except pytesseract.TesseractNotFoundError:
                print("\n오류: Tesseract가 설치되지 않았습니다.")
                print("해결 방법:")
                print("  1. https://github.com/UB-Mannheim/tesseract/wiki 에서 Tesseract 다운로드")
                print("  2. 설치 시 'Additional language data' 옵션에서 Korean 선택")
                print("  3. 환경 변수 PATH에 Tesseract 경로 추가")
                print("     예: C:\\Program Files\\Tesseract-OCR")
                return []
        
        doc.close()
        print(f"\n총 {len(text_blocks)}개 텍스트 블록 추출 완료")
        return text_blocks
        
    except Exception as e:
        print(f"OCR 처리 오류: {e}")
        import traceback
        traceback.print_exc()
        return []


def extract_text_with_fallback(pdf_path: str) -> List[Dict]:
    """
    일반 추출 시도 후 실패 시 OCR로 전환
    
    Args:
        pdf_path: PDF 파일 경로
        
    Returns:
        List[dict]: 텍스트 블록 리스트
    """
    # 먼저 일반 텍스트 추출 시도
    from pdf_parser import extract_text_with_coordinates
    
    print("PDF 텍스트 추출 시도 중...")
    text_blocks = extract_text_with_coordinates(pdf_path)
    
    if not text_blocks or len(text_blocks) < 10:
        print("  → 텍스트 추출 실패 또는 내용 부족")
        print("  → 이미지 기반 PDF로 판단, OCR 모드로 전환")
        print("\nOCR 처리 시작...")
        text_blocks = extract_text_from_image_pdf(pdf_path)
    else:
        print(f"  → 텍스트 추출 성공 ({len(text_blocks)}개 블록)")
    
    return text_blocks
