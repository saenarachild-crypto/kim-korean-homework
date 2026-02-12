"""
샘플 테스트 모듈
가상의 국어 지문으로 전체 시스템을 테스트
"""

from data_processor import parse_to_json, validate_item, save_to_json
from docx_generator import generate_word_document


def create_sample_structure():
    """
    테스트용 샘플 구조 데이터를 생성합니다.
    """
    return {
        "passages": [
            """다음 글을 읽고 물음에 답하시오.

[가]
현대 사회에서 인공지능 기술의 발전은 우리 삶의 많은 부분을 변화시키고 있다. 특히 자연어 처리 분야에서의 발전은 사람과 기계의 소통 방식을 혁신적으로 바꾸어 놓았다. 이러한 변화는 단순히 기술적 진보에 그치지 않고, 사회 전반의 구조적 변화를 이끌어내고 있다.

[나]
그러나 기술의 발전에는 항상 윤리적 고민이 따른다. 인공지능이 인간의 판단을 대신하게 될 때, 그 책임은 누구에게 있는가? 이러한 질문은 단순히 기술적 문제가 아니라 철학적, 법적 문제이기도 하다.""",
            
            """다음 시를 읽고 물음에 답하시오.

봄이 오면 산에 들에
진달래 피네
노오란 개나리
하얀 목련
꽃들이 만발하네

새들은 노래하고
나비는 춤추네
봄바람에 실려오는
꽃향기 가득하네"""
        ],
        
        "boxes": [
            """<보 기>

ㄱ. 인공지능의 발전은 사회 구조의 변화를 가져온다.
ㄴ. 기술 발전에는 윤리적 고민이 필요하다.
ㄷ. 자연어 처리는 소통 방식을 변화시킨다.
ㄹ. 인공지능의 책임 문제는 복합적이다.""",
            
            """<보 기>

봄의 이미지: 진달래, 개나리, 목련
생명의 약동: 새, 나비의 움직임
감각적 표현: 색채어, 청각적 이미지"""
        ],
        
        "questions": [
            "12. 위 글의 내용과 일치하는 것은?",
            "13. 시의 표현상 특징으로 적절한 것은?"
        ],
        
        "options": [
            "① 인공지능 기술은 기술적 영역에만 영향을 미친다.",
            "② 자연어 처리의 발전은 소통 방식을 변화시켰다.",
            "③ 기술 발전에는 윤리적 고민이 필요하지 않다.",
            "④ 인공지능의 책임 문제는 단순한 기술적 문제이다.",
            "⑤ 현대 사회에서 인공지능은 중요하지 않다.",
            
            "① 추상적 관념어를 통해 주제를 표현하고 있다.",
            "② 다양한 색채어를 사용하여 시각적 이미지를 형성하고 있다.",
            "③ 반어적 표현을 통해 화자의 정서를 드러내고 있다.",
            "④ 과거 회상을 통해 그리움을 표현하고 있다.",
            "⑤ 객관적 상관물을 통해 감정을 절제하고 있다."
        ]
    }


def test_full_pipeline():
    """
    전체 파이프라인을 테스트합니다.
    """
    print("=" * 60)
    print("샘플 테스트 시작")
    print("=" * 60)
    
    # 1. 샘플 구조 생성
    print("\n[1/3] 샘플 데이터 생성 중...")
    structure = create_sample_structure()
    
    print(f"생성된 샘플:")
    print(f"  - 지문: {len(structure['passages'])}개")
    print(f"  - 보기: {len(structure['boxes'])}개")
    print(f"  - 문제: {len(structure['questions'])}개")
    print(f"  - 선지: {len(structure['options'])}개")
    
    # 2. JSON 변환
    print("\n[2/3] JSON 변환 중...")
    data = parse_to_json(structure)
    
    # JSON 저장
    json_output = "output_sample.json"
    save_to_json(data, json_output)
    print(f"JSON 저장 완료: {json_output}")
    
    # 3. 문항 검증
    print("\n[3/3] 문항 검증 중...")
    items = data.get("items", [])
    
    for item in items:
        is_valid = validate_item(item)
        status = "[OK]" if is_valid else "[FAIL]"
        print(f"{status} 문항 {item.get('item_number', '?')}: {len(item.get('options', []))}개 선지")
    
    # 4. Word 문서 생성
    print("\nWord 문서 생성 중...")
    docx_output = "output_sample.docx"
    success = generate_word_document(data, docx_output, use_two_columns=True)
    
    if success:
        print("\n" + "=" * 60)
        print("[완료] 테스트 성공!")
        print(f"생성된 파일:")
        print(f"  - JSON: {json_output}")
        print(f"  - Word: {docx_output}")
        print("\n다음 사항을 확인해주세요:")
        print("  1. Word 파일에서 ①~⑤ 특수문자가 제대로 표시되는지")
        print("  2. 보기 박스에 테두리가 있는지")
        print("  3. 2단 레이아웃이 적용되었는지")
        print("  4. 한글 폰트(바탕체)가 적용되었는지")
        print("=" * 60)
    else:
        print("\n오류: 테스트 실패")
    
    return success


if __name__ == "__main__":
    test_full_pipeline()
