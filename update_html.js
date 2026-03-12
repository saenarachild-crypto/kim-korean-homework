const fs = require('fs');

const teacherFile = 'c:\\\\Users\\\\saena\\\\OneDrive - 정현고등학교\\\\바탕 화면\\\\kim-korean-homework\\\\셀프해설지_완성본.html';
const templateFile = 'c:\\\\Users\\\\saena\\\\OneDrive - 정현고등학교\\\\바탕 화면\\\\kim-korean-homework\\\\3월1회차_마침내모고.html';

let teacherHtml = fs.readFileSync(teacherFile, 'utf8');
let templateHtml = fs.readFileSync(templateFile, 'utf8');

// Replace the hardcoded examConfig with a placeholder token.
// The hardcoded examConfig looks like: const examConfig = {...};
templateHtml = templateHtml.replace(/const examConfig = \{[\s\S]*?\n\};/, 'const examConfig = __INJECT_EXAM_CONFIG__;');

// We need to inject templateHtml into teacherHtml as a string literal.
// Let's use backticks, so we must escape any backticks, backslashes and ${ inside templateHtml
let escapedTemplateHtml = templateHtml
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

const newHandleGenerate = `
      const handleGenerate = () => {
        const answersStrArr = answersStr.split(',').map(s => s.trim()).filter(Boolean);
        if (!examName || !answersStrArr.length) { alert('시험명과 정답은 필수입니다.'); return; }
        const validPassages = passages.filter(p => p.name.trim());
        
        // Build the new examConfig based on TeacherApp inputs
        let announcementText = '';
        if (paperLink || answerLink) {
            announcementText += '※ 참고 링크\\n';
            if (paperLink) announcementText += '- 시험지 보기: ' + paperLink + '\\n';
            if (answerLink) announcementText += '- 정답/해설 보기: ' + answerLink + '\\n';
        }
        
        let passagesData = [];
        let assigned = new Set();
        
        // If passages are provided, map them
        if (validPassages.length > 0) {
            validPassages.forEach((p, i) => {
                const rangeQs = [];
                for (let q = p.from; q <= p.to; q++) {
                    if (q - 1 < answersStrArr.length) {
                        rangeQs.push({ qNum: q, correctAnswer: answersStrArr[q - 1] });
                        assigned.add(q);
                    }
                }
                passagesData.push({
                    id: 'passage_' + (i + 1),
                    title: p.name,
                    questions: rangeQs
                });
            });
        }
        
        let unassignedQs = [];
        for (let q = 1; q <= answersStrArr.length; q++) {
            if (!assigned.has(q)) {
                unassignedQs.push({ qNum: q, correctAnswer: answersStrArr[q - 1] });
            }
        }
        
        // Add unassigned questions as a separate "passage"
        if (unassignedQs.length > 0) {
            passagesData.push({
                id: 'passage_기타',
                title: '기타 문항',
                questions: unassignedQs
            });
        }

        const config = {
           examName: examName,
           announcement: announcementText,
           passages: passagesData
        };

        const templateString = \`${escapedTemplateHtml}\`;
        
        // Inject the generated config
        const html = templateString.replace('__INJECT_EXAM_CONFIG__', JSON.stringify(config));
        
        setGeneratedLink(html);
      };
`;

// Replace the old handleGenerate with the new one
const handleGenerateRegex = /const handleGenerate = async \(\) => \{[\s\S]*?catch \(e\) \{[\s\S]*?\}[\s\S]*?\};/;
if (handleGenerateRegex.test(teacherHtml)) {
    teacherHtml = teacherHtml.replace(handleGenerateRegex, newHandleGenerate.trim());
    fs.writeFileSync(teacherFile, teacherHtml);
    console.log('Successfully updated handleGenerate in TeacherApp!');
} else {
    console.error('Could not find handleGenerate block in TeacherApp to replace.');
}
