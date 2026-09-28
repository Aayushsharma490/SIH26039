const creds = require('fs').readFileSync('C:\\Users\\AAYUSH\\.claude-code-via-antigravity-credentials.json', 'utf8');
const token = JSON.parse(creds).access_token;

async function testModel(modelName) {
    const res = await fetch('https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
            "Client-Metadata": JSON.stringify({ ideType: "IDE_UNSPECIFIED", platform: "PLATFORM_UNSPECIFIED", pluginType: "GEMINI" }),
        },
        body: JSON.stringify({
            project: 'aicode-consumers',
            model: modelName,
            request: { contents: [{ role: 'user', parts: [{ text: 'hello' }] }] },
            requestType: "agent",
        })
    });
    console.log(`Model: ${modelName} -> Status: ${res.status}`);
    const text = await res.text();
    if (res.status !== 200) console.log(text.slice(0, 150));
}

async function run() {
    await testModel('claude-sonnet-4-5');
    await testModel('gemini-2.5-pro');
    await testModel('gemini-3.0-pro');
    await testModel('gemini-2.0-pro');
    await testModel('gemini-1.5-pro');
}
run();
