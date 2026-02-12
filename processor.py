"""
메인 프로세서
PDF → JSON → Word 전체 변환 파이프라인
"""

from ocr_processor import extract_text_with_fallback
from data_processor import parse_to_json, validate_item, save_to_json
from docx_generator import generate_word_document
from pdf_parser import merge_two_columns, identify_structure
from typing import Optional


def process_korean_test(
    pdf_path: str,
    output_docx_path: str,
    output_json_path: Optional[str] = None,
    use_two_columns: bool = True
) -> bool:
    """
    국어 시험지 PDF를 Word 문서로 변환합니다.
    이미지 기반 PDF는 자동으로 OCR 처리됩니다.
    
    Args:
        pdf_path: 입력 PDF 파일 경로
        output_docx_path: 출력 Word 파일 경로
        output_json_path: JSON 중간 파일 경로 (선택사항)
        use_two_columns: 2단 레이아웃 사용 여부
        
    Returns:
        bool: 변환 성공 여부
    """
    print("=" * 60)
    print("국어 시험지 변환 시작")
    print("=" * 60)
    
    # 1. PDF 파싱 (OCR 자동 fallback)
    print("\n[1/4] PDF 파싱 중...")
    text_blocks = extract_text_with_fallback(pdf_path)
    
    if not text_blocks:
        print("오류: PDF에서 텍스트를 추출하지 못했습니다.")
        return False
    
    print(f"추출된 텍스트 블록: {len(text_blocks)}개")
    
    # 2. 2단 병합
    print("\n[2/4] 2단 레이아웃 병합 중...")
    merged_text = merge_two_columns(text_blocks)
    
    if not merged_text:
        print("오류: 텍스트 병합에 실패했습니다.")
        return False
    
    print(f"병합된 텍스트 길이: {len(merged_text)} 문자")
    
    # 3. 구조 식별
    print("\n[3/4] 구조 분석 중...")
    structure = identify_structure(merged_text)
    
    print(f"식별된 구조:")
    print(f"  - 지문: {len(structure['passages'])}개")
    print(f"  - 보기: {len(structure['boxes'])}개")
    print(f"  - 문제: {len(structure['questions'])}개")
    print(f"  - 선지: {len(structure['options'])}개")
    
    # 4. JSON 변환
    print("\n[4/4] JSON 변환 및 문서 생성 중...")
    data = parse_to_json(structure)
    
    # JSON 저장 (선택사항)
    if output_json_path:
        save_to_json(data, output_json_path)
        print(f"JSON 저장 완료: {output_json_path}")
    
    # 문항 검증
    items = data.get("items", [])
    print(f"\n총 {len(items)}개 문항 검증 중...")
    
    valid_count = 0
    for item in items:
        if validate_item(item):
            valid_count += 1
        else:
            print(f"  [경고] 문항 {item.get('item_number', '?')} 검증 실패")
    
    print(f"검증 통과: {valid_count}/{len(items)} 문항")
    
    # 5. Word 문서 생성
    print("\nWord 문서 생성 중...")
    success = generate_word_document(data, output_docx_path, use_two_columns)
    
    if success:
        print("\n" + "=" * 60)
        print("[완료] 변환 성공!")
        print(f"출력 파일: {output_docx_path}")
        print("=" * 60)
    else:
        print("\n오류: Word 문서 생성에 실패했습니다.")
    
    return success


if __name__ == "__main__":
    # 예시 실행
    import sys
    
    if len(sys.argv) < 3:
        print("사용법: python processor.py <입력_PDF> <출력_DOCX> [출력_JSON]")
        print("예시: python processor.py test.pdf output.docx output.json")
    else:
        pdf_file = sys.argv[1]
        docx_file = sys.argv[2]
        json_file = sys.argv[3] if len(sys.argv) > 3 else None
        
        process_korean_test(pdf_file, docx_file, json_file)
