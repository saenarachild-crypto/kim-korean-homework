const fs = require('fs');
async function run() {
  const payload = fs.readFileSync('test_payload.json', 'utf8');
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  console.log("RESPONSE:", data.response);
}
run().catch(console.error);
