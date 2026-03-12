const fs = require('fs');
const teacherFile = 'c:\\\\Users\\\\saena\\\\OneDrive - 정현고등학교\\\\바탕 화면\\\\kim-korean-homework\\\\셀프해설지_완성본.html';
let html = fs.readFileSync(teacherFile, 'utf8');

// Replace everything from the Student App header to ReactDOM.createRoot
// with just ReactDOM.createRoot
const regex = /\/\/ ─── Student App ─+[\s\S]*?(?=ReactDOM\.createRoot)/;
html = html.replace(regex, '');

// The old ReactDOM.createRoot did <App />. Let's make sure it still does.
fs.writeFileSync(teacherFile, html);
console.log('Cleaned up StudentApp!');
