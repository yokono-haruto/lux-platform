const fs = require('fs');
const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ERROR_MESSAGE = process.env.ERROR_MESSAGE;
const STACK_TRACE = process.env.STACK_TRACE;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set');
  process.exit(1);
}

async function analyzeErrorWithGemini() {
  const prompt = `あなたはシステムエラーを分析して修正案を提案するエキスパートです。

以下のエラーログとスタックトレースを分析してください：

エラーログ:
${ERROR_MESSAGE}

スタックトレース:
${STACK_TRACE}

以下の形式でJSON形式で回答してください：
{
  "analysis": "エラーの原因を日本語で簡潔に説明（100文字以内）",
  "fixCode": "修正後のコード全体（該当ファイルの完全なコード）",
  "filePath": "修正が必要なファイルのパス（例: client/src/App.tsx）",
  "severity": "low/medium/high のいずれか",
  "fixTitle": "修正内容の簡潔なタイトル（例: Fix undefined variable error in App.tsx）"
}

注意：
- fixCodeは該当ファイルの完全なコードを含めてください
- filePathはプロジェクトルートからの相対パスで指定してください
- 修正が不可能な場合は、fixCodeを空文字列にしてください
- fixTitleは英語で簡潔に記述してください`;

  const data = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8000,
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // JSONを抽出
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            reject(new Error('Failed to parse Gemini response'));
            return;
          }

          const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          resolve(analysis);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🤖 Analyzing error with Gemini AI...');
    
    const result = await analyzeErrorWithGemini();
    
    console.log('✅ Analysis complete');
    console.log('📝 Fix title:', result.fixTitle);
    console.log('📄 File path:', result.filePath);
    console.log('⚠️  Severity:', result.severity);
    console.log('💡 Analysis:', result.analysis);

    // GitHub Actionsの出力に設定
    if (result.fixCode && result.fixCode.trim()) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `fix_available=true\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `fix_title=${result.fixTitle}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `file_path=${result.filePath}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `severity=${result.severity}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `analysis=${result.analysis}\n`);
      
      // 修正コードをファイルに保存
      fs.writeFileSync('/tmp/fix_code.txt', result.fixCode);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `fix_code<<EOF\n${result.fixCode}\nEOF\n`);
      
      console.log('✅ Fix is available and ready to apply');
    } else {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `fix_available=false\n`);
      console.log('⚠️  No fix available');
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `fix_available=false\n`);
    process.exit(1);
  }
}

main();
