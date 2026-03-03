import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyD7agdGlAVoohUHkyiT4EyJcai95cTtmEc';
const ai = new GoogleGenAI({ apiKey });

async function testUpload() {
    const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000288 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n383\n%%EOF', 'utf8');

    const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/pdf'
        },
        body: pdfBytes
    });
    const data = await response.json();
    console.log('Uploaded URI:', data.file.uri);

    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: 'Describe the document content exactly.' },
                    { fileData: { fileUri: data.file.uri, mimeType: 'application/pdf' } }
                ]
            }
        ]
    });
    console.log('Result:', res.text);
}
testUpload();
