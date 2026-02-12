"""
PDF 파싱 모듈
PyMuPDF를 사용하여 국어 시험지 PDF에서 좌표 기반 텍스트 추출 및 2단 레이아웃 처리
"""

import fitz  # PyMuPDF
import re
from typing import List, Dict, Tuple


def extract_text_with_coordinates(pdf_path: str) -> List[Dict]:
    """
    PDF에서 텍스트와 좌표 정보를 추출합니다.
    
    Args:
        pdf_path: PDF 파일 경로
        
    Returns:
        List[dict]: [{"text": str, "x": float, "y": float, "page": int}, ...]
    """
    text_blocks = []
    
    try:
        doc = fitz.open(pdf_path)
        
        for page_num, page in enumerate(doc):
            # 텍스트 블록 추출 (좌표 포함)
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if block.get("type") == 0:  # 텍스트 블록
                    # 블록 내 모든 라인 추출
                    for line in block.get("lines", []):
                        line_text = ""
                        for span in line.get("spans", []):
                            line_text += span.get("text", "")
                        
                        if line_text.strip():
                            text_blocks.append({
                                "text": line_text.strip(),
                                "x": block["bbox"][0],  # 좌측 x 좌표
                                "y": line["bbox"][1],    # 상단 y 좌표
                                "page": page_num
                            })
        
        doc.close()
        return text_blocks
        
    except Exception as e:
        print(f"PDF 파싱 오류: {e}")
        return []


def merge_two_columns(text_blocks: List[Dict], page_width: float = 595.0) -> str:
    """
    좌표 기반으로 2단 텍스트를 올바른 순서로 정렬합니다.
    
    Args:
        text_blocks: 텍스트 블록 리스트 (좌표 포함)
        page_width: 페이지 너비 (A4 기준 595pt)
        
    Returns:
        str: 병합된 텍스트
    """
    if not text_blocks:
        return ""
    
    # 페이지별로 그룹화
    pages = {}
    for block in text_blocks:
        page_num = block["page"]
        if page_num not in pages:
            pages[page_num] = []
        pages[page_num].append(block)
    
    merged_text = []
    center_x = page_width / 2
    
    for page_num in sorted(pages.keys()):
        page_blocks = pages[page_num]
        
        # 왼쪽 단과 오른쪽 단 분리
        left_column = [b for b in page_blocks if b["x"] < center_x]
        right_column = [b for b in page_blocks if b["x"] >= center_x]
        
        # y 좌표 기준 정렬
        left_column.sort(key=lambda b: b["y"])
        right_column.sort(key=lambda b: b["y"])
        
        # 왼쪽 단 → 오른쪽 단 순서로 병합
        for block in left_column:
            merged_text.append(block["text"])
        for block in right_column:
            merged_text.append(block["text"])
    
    return "\n".join(merged_text)


def identify_structure(text: str) -> Dict[str, List[str]]:
    """
    정규표현식으로 구조 요소를 식별합니다.
    
    Args:
        text: 추출된 텍스트
        
    Returns:
        dict: {"passages": [...], "boxes": [...], "questions": [...], "options": [...]}
    """
    lines = text.split("\n")
    
    structure = {
        "passages": [],
        "boxes": [],
        "questions": [],
        "options": []
    }
    
    current_passage = []
    current_box = []
    in_box = False
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 보기 박스 시작
        if re.match(r"<\s*보\s*기\s*>", line):
            in_box = True
            current_box = [line]
            continue
        
        # 보기 박스 종료 (문제 번호나 선택지가 나오면)
        if in_box and (re.match(r"^\d+\.", line) or re.match(r"^[①②③④⑤]", line)):
            if current_box:
                structure["boxes"].append("\n".join(current_box))
                current_box = []
            in_box = False
        
        # 보기 박스 내용
        if in_box:
            current_box.append(line)
            continue
        
        # 문제 번호 (숫자로 시작)
        if re.match(r"^\d+\.", line):
            # 이전 지문 저장
            if current_passage:
                structure["passages"].append("\n".join(current_passage))
                current_passage = []
            structure["questions"].append(line)
            continue
        
        # 선택지 (① ~ ⑤)
        if re.match(r"^[①②③④⑤]", line):
            structure["options"].append(line)
            continue
        
        # 지문 (긴 텍스트)
        if len(line) > 10:  # 최소 길이 필터
            current_passage.append(line)
    
    # 마지막 지문 저장
    if current_passage:
        structure["passages"].append("\n".join(current_passage))
    
    # 마지막 보기 저장
    if current_box:
        structure["boxes"].append("\n".join(current_box))
    
    return structure


def preserve_special_chars(text: str) -> str:
    """
    특수문자(①~⑤)를 보존합니다.
    
    Args:
        text: 원본 텍스트
        
    Returns:
        str: 특수문자가 보존된 텍스트
    """
    # UTF-8 인코딩 확인
    return text.encode('utf-8', errors='ignore').decode('utf-8')
