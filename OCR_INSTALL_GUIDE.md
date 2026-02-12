# Tesseract OCR 설치 가이드

## 문제 상황

제공하신 PDF 파일(`연습.pdf`)은 **이미지 기반 PDF**입니다. 각 페이지가 텍스트가 아닌 이미지로 구성되어 있어서 일반적인 텍스트 추출이 불가능합니다.

이 경우 **OCR(Optical Character Recognition, 광학 문자 인식)**이 필요합니다.

---

## Tesseract OCR 설치 방법

### 1단계: 다운로드

https://github.com/UB-Mannheim/tesseract/wiki 페이지에서:
- **tesseract-ocr-w64-setup-x.x.x.exe** 다운로드 (Windows 64비트용)

### 2단계: 설치

1. 다운로드한 설치 파일 실행
2. 설치 옵션 화면에서 **"Additional language data"** 항목 확장
3. **Korean** 체크박스 선택 (필수!)
4. 설치 진행 (기본 경로: `C:\Program Files\Tesseract-OCR`)

### 3단계: 환경 변수 설정

1. **시스템 속성** → **고급** → **환경 변수** 클릭
2. **시스템 변수**에서 `Path` 선택 후 **편집** 클릭
3. **새로 만들기** 클릭 후 Tesseract 설치 경로 추가:
   ```
   C:\Program Files\Tesseract-OCR
   ```
4. **확인** 클릭하여 저장

### 4단계: 설치 확인

새로운 명령 프롬프트를 열고:
```powershell
tesseract --version
```

버전 정보가 표시되면 설치 성공!

---

## 설치 후 사용 방법

Tesseract 설치가 완료되면, 기존 명령어를 그대로 사용하시면 됩니다:

```powershell
python processor.py "C:\Users\saena\OneDrive - 정현고등학교\바탕 화면\연습.pdf" "출력결과.docx" "데이터.json"
```

프로그램이 자동으로:
1. 텍스트 추출 시도
2. 실패 시 OCR 모드로 전환
3. 이미지에서 한글 텍스트 인식
4. Word 문서 생성

---

## 대안: 텍스트 기반 PDF로 테스트

Tesseract 설치가 번거로우시다면, **텍스트 복사가 가능한 PDF**가 있는지 확인해보세요. 텍스트 기반 PDF는 OCR 없이도 바로 변환됩니다.

PDF에서 텍스트를 마우스로 드래그하여 복사할 수 있다면 → 텍스트 기반 PDF ✅  
복사가 안 되고 이미지처럼 보인다면 → 이미지 기반 PDF (OCR 필요) ⚠️
