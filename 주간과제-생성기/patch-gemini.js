const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'services', 'geminiService.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const targetStr = `  const addFilesToParts = async (files: File[], label: string) => {
    if (files.length === 0) return;
    parts.push({ text: \`\\n--- [\${label} 데이터] ---\` });
    for (const file of files) {
      const base64 = await fileToBase64(file);
      parts.push({ text: \`\\n파일명: \${file.name}\` });
      parts.push({
        inlineData: { data: base64, mimeType: file.type }
      });
    }
  };`;

const replaceStr = `  const addFilesToParts = async (files: File[], label: string) => {
    if (files.length === 0) return;
    parts.push({ text: \`\\n--- [\${label} 데이터] ---\` });

    const processedFiles: File[] = [];
    for (const file of files) {
      const chunks = await splitPdfIfNeeded(file);
      if (chunks.length > 1) {
        onLog?.(\`📄 \${file.name} → \${chunks.length}개 청크로 자동 분할됨 (총 용량 최적화)\`);
      }
      processedFiles.push(...chunks);
    }

    onLog?.(\`⬆️ \${label} 파일 \${processedFiles.length}개 변환 중...\`);

    for (const file of processedFiles) {
      try {
        const base64 = await fileToBase64(file);
        parts.push({ text: \`\\n파일명: \${file.name}\` });
        parts.push({
          inlineData: { data: base64, mimeType: file.type || 'application/pdf' }
        });
      } catch (err) {
        console.warn(\`\${file.name} 읽기 실패:\`, err);
      }
    }
  };`;

if (!content.includes(targetStr)) {
    console.error("Target string not found in geminiService.ts!");
    process.exit(1);
}

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(targetPath, content, 'utf8');
console.log("Successfully patched geminiService.ts!");
