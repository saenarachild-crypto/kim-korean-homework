"""
데이터 구조화 모듈
추출된 텍스트를 구조화된 JSON으로 변환하고 검증
"""

import json
import re
from typing import Dict, List, Optional


def parse_to_json(structure: Dict[str, List[str]]) -> Dict:
    """
    구조화된 데이터를 JSON 형식으로 변환합니다.
    
    Args:
        structure: identify_structure()의 출력
        
    Returns:
        dict: JSON 형식의 문항 데이터
    """
    items = []
    
    questions = structure.get("questions", [])
    options_list = structure.get("options", [])
    passages = structure.get("passages", [])
    boxes = structure.get("boxes", [])
    
    # 문제 번호별로 그룹화
    current_item_num = 0
    current_options = []
    
    for i, question in enumerate(questions):
        # 문제 번호 추출
        match = re.match(r"^(\d+)\.", question)
        if match:
            item_num = int(match.group(1))
            
            # 이전 문항의 선지 저장
            if current_item_num > 0 and current_options:
                # 이전 문항 완성
                items[-1]["options"] = current_options[:5]  # 최대 5개
                current_options = []
            
            # 새 문항 시작
            item = {
                "item_number": item_num,
                "passage": passages[i] if i < len(passages) else "",
                "box_content": boxes[i] if i < len(boxes) else "",
                "question": question,
                "options": []
            }
            items.append(item)
            current_item_num = item_num
    
    # 선지 할당
    option_idx = 0
    for item in items:
        item_options = []
        while option_idx < len(options_list) and len(item_options) < 5:
            item_options.append(options_list[option_idx])
            option_idx += 1
        item["options"] = item_options
    
    return {"items": items}


def preserve_newlines(text: str) -> str:
    """
    보기 박스 내 줄바꿈을 보존합니다.
    
    Args:
        text: 원본 텍스트
        
    Returns:
        str: 줄바꿈이 보존된 텍스트
    """
    # 이미 줄바꿈이 있는 경우 그대로 유지
    return text


def validate_item(item: Dict) -> bool:
    """
    문항 데이터의 완결성을 검증합니다.
    
    Args:
        item: 문항 데이터
        
    Returns:
        bool: 검증 통과 여부
    """
    required_fields = ["item_number", "question", "options"]
    
    # 필수 필드 확인
    for field in required_fields:
        if field not in item:
            print(f"검증 실패: {field} 필드 누락")
            return False
    
    # 선지 개수 확인 (최소 1개, 최대 5개)
    if not item["options"] or len(item["options"]) > 5:
        print(f"검증 실패: 문항 {item['item_number']} 선지 개수 이상 ({len(item['options'])}개)")
        return False
    
    # 선지 형식 확인 (①~⑤로 시작해야 함)
    for option in item["options"]:
        if not re.match(r"^[①②③④⑤]", option):
            print(f"검증 실패: 잘못된 선지 형식 - {option}")
            return False
    
    return True


def save_to_json(data: Dict, output_path: str) -> bool:
    """
    JSON 데이터를 파일로 저장합니다.
    
    Args:
        data: 저장할 데이터
        output_path: 출력 파일 경로
        
    Returns:
        bool: 저장 성공 여부
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"JSON 저장 오류: {e}")
        return False


def load_from_json(json_path: str) -> Optional[Dict]:
    """
    JSON 파일을 로드합니다.
    
    Args:
        json_path: JSON 파일 경로
        
    Returns:
        dict or None: 로드된 데이터
    """
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"JSON 로드 오류: {e}")
        return None
