// api/generate.js
// 这是一个 Serverless 函数，运行在 Vercel 云端
// 作用：代替前端调用阿里云 API，避免 CORS 跨域问题

export default async function handler(req, res) {
  // 1. 接收前端传来的会议内容
  const { content, type = 'summary' } = req.body;

  if (!content) {
    return res.status(400).json({ error: '缺少会议内容' });
  }

  // 2. ⚠️ 填入您的通义千问 API Key（只有这里能看到）
  const API_KEY = 'sk-54bbf86cafc54f209cfe88cd884d03f0'; // 👈 在这里替换为您的真实 Key

  // 3. 设置模型
  const MODEL = 'qwen-turbo'; // 推荐：快、便宜

  // 4. 构造提示词（Prompt）
  const prompt = type === 'summary'
    ? `请生成简明会议纪要：\n1. 主题：一句话\n2. 决策：每条一行\n3. 任务：任务+负责人\n\n【内容】\n${content}`
    : `请从以下内容中提取任务：\n格式：任务 | 负责人 | 截止时间\n\n${content}`;

  try {
    // 5. 调用阿里云 API（服务端请求，无 CORS 限制）
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        input: {
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        parameters: {
          result_format: 'text'
        }
      })
    });

    const data = await response.json();

    // 6. 返回结果给前端
    if (data.output && data.output.text) {
      res.status(200).json({ text: data.output.text });
    } else {
      res.status(500).json({ error: 'AI 生成失败', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: '请求阿里云失败', message: error.message });
  }
}

// Vercel 配置
export const config = {
  api: {
    bodyParser: true,
  },
};