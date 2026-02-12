# 국어 시험지 변환기 사용 가이드

## 📖 소개

국어 시험지 PDF를 Word 문서로 변환하는 도구입니다. 지문, 보기, 문제, 선택지의 구조를 완벽히 보존하며 변환합니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```powershell
pip install -r requirements.txt
```

### 2. 샘플 테스트 실행

```powershell
python test_sample.py
```

생성된 파일:
- `output_sample.json` - 추출된 데이터 (JSON 형식)
- `output_sample.docx` - 변환된 Word 문서

### 3. 실제 PDF 변환

```powershell
python processor.py 입력파일.pdf 출력파일.docx
```

선택사항으로 JSON 파일도 생성하려면:
```powershell
python processor.py 입력파일.pdf 출력파일.docx 출력파일.json
```

## 📁 파일 구조

```
kim-korean-homework/
├── requirements.txt       # 의존성 목록
├── pdf_parser.py         # PDF 파싱 엔진
├── data_processor.py     # 데이터 구조화
├── docx_generator.py     # Word 문서 생성
├── processor.py          # 메인 실행 파일
└── test_sample.py        # 샘플 테스트
```

## 🔧 주요 기능

### 1. 좌표 기반 텍스트 추출
- PyMuPDF를 사용하여 PDF의 텍스트와 좌표 정보 추출
- 2단 레이아웃 자동 인식 및 병합

### 2. 구조 식별
정규표현식으로 다음 요소를 자동 식별:
- **지문**: [가], [나] 등의 긴 텍스트 블록
- **보기**: `<보 기>` 박스 안의 내용
- **문제**: 숫자로 시작하는 문항 (예: 12. 다음 중...)
- **선지**: ①②③④⑤로 시작하는 다섯 개의 선택지

### 3. Word 문서 생성
- 2단 레이아웃 재현
- 보기 박스를 테이블로 표현 (테두리 포함)
- 선지 길이에 따라 자동 배치 (가로/세로)
- 한글 폰트 자동 적용 (바탕체)

## 📝 데이터 형식

### JSON 스키마
```json
{
  "items": [
    {
      "item_number": 12,
      "passage": "지문 전체 텍스트...",
      "box_content": "<보 기>\n내용...",
      "question": "12. 다음 중...",
      "options": [
        "① 첫 번째 선지",
        "② 두 번째 선지",
        ...
      ]
    }
  ]
}
```

## ⚙️ 설정 옵션

### 2단 레이아웃 비활성화
```python
from processor import process_korean_test

process_korean_test(
    'input.pdf',
    'output.docx',
    use_two_columns=False  # 1단 레이아웃
)
```

### 폰트 변경
`docx_generator.py`의 `apply_korean_font()` 함수 수정:
```python
apply_korean_font(doc, font_name="NanumMyeongjo")
```

## ✅ 검증 체크리스트

생성된 Word 파일에서 다음 사항을 확인하세요:

- [ ] ①②③④⑤ 특수문자가 제대로 표시되는가?
- [ ] 보기 박스에 테두리가 있는가?
- [ ] 2단 레이아웃이 적용되었는가?
- [ ] 한글 폰트가 제대로 적용되었는가?
- [ ] 지문과 문제가 정확히 구분되었는가?

## 🐛 문제 해결

### PDF에서 텍스트를 추출하지 못하는 경우
- PDF가 이미지 기반인지 확인 (OCR 필요)
- PDF 파일이 손상되지 않았는지 확인

### 2단 병합이 잘못된 경우
`pdf_parser.py`의 `merge_two_columns()` 함수에서 `page_width` 조정:
```python
merged_text = merge_two_columns(text_blocks, page_width=600)
```

### 특수문자가 깨지는 경우
- UTF-8 인코딩 확인
- 시스템에 한글 폰트 설치 여부 확인

### 구조 식별이 부정확한 경우
`pdf_parser.py`의 `identify_structure()` 함수에서 정규표현식 패턴 조정

## 💡 팁

1. **PDF 품질**: 텍스트 기반 PDF가 가장 좋은 결과를 냅니다.
2. **폰트 설치**: 바탕체 또는 NanumMyeongjo 폰트가 시스템에 설치되어 있어야 합니다.
3. **대용량 파일**: 매우 큰 PDF의 경우 처리 시간이 오래 걸릴 수 있습니다.
4. **수동 검토**: 자동 변환 후 반드시 수동으로 검토하세요.

## 📧 다음 단계

실제 국어 시험지 PDF 파일로 테스트해보세요!

```powershell
python processor.py 실제시험지.pdf 출력결과.docx 출력데이터.json
```

문제가 발생하면 JSON 파일을 확인하여 어느 단계에서 문제가 생겼는지 파악할 수 있습니다.
