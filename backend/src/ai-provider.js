// OpenAI 호환 스펙(OpenAI·OpenRouter)은 요청·응답 형태가 같아 어댑터를 공유한다.
function openAiCompatible({ name, baseUrl, chatPath, defaultModel, extraHeaders = {} }) {
  return {
    name,
    baseUrl,
    chatPath,
    defaultModel,
    buildHeaders(apiKey) {
      return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      };
    },
    buildBody(model, messages) {
      return JSON.stringify({ model, messages, temperature: 0.2 });
    },
    extractContent(json) {
      return json.choices?.[0]?.message?.content || '';
    },
  };
}

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    chatPath: null,
    defaultModel: 'gemini-2.0-flash',
    buildChatUrl(model) {
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    },
    buildHeaders(apiKey) {
      return {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      };
    },
    buildBody(model, messages) {
      const systemMsg = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      const contents = userMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const body = { contents, generationConfig: { temperature: 0.2 } };
      if (systemMsg) {
        body.systemInstruction = { parts: [{ text: systemMsg.content }] };
      }
      return JSON.stringify(body);
    },
    extractContent(json) {
      return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
  },

  openai: openAiCompatible({
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    chatPath: '/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
  }),

  anthropic: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    chatPath: '/v1/messages',
    defaultModel: 'claude-sonnet-5',
    buildHeaders(apiKey) {
      return {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      };
    },
    buildBody(model, messages) {
      // Anthropic 은 system 을 messages 가 아니라 최상위 필드로 받는다.
      const systemMsg = messages.find(m => m.role === 'system');
      const body = {
        model,
        max_tokens: 4096,
        temperature: 0.2,
        messages: messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      };
      if (systemMsg) body.system = systemMsg.content;
      return JSON.stringify(body);
    },
    extractContent(json) {
      if (!Array.isArray(json.content)) return '';
      return json.content.filter(part => part?.type === 'text').map(part => part.text).join('');
    },
  },

  openrouter: openAiCompatible({
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai',
    chatPath: '/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o-mini',
  }),
};

async function chat(providerName, apiKey, model, messages) {
  const provider = PROVIDERS[providerName];
  if (!provider) throw new Error(`Unknown provider: ${providerName}`);
  if (!apiKey) throw new Error('API key is required');
  if (!model) throw new Error('Model name is required');

  const url = provider.buildChatUrl
    ? provider.buildChatUrl(model, apiKey)
    : `${provider.baseUrl}${provider.chatPath}`;

  const headers = provider.buildHeaders(apiKey);
  const body = provider.buildBody(model, messages);

  // 25초 API 타임아웃 처리
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, { 
      method: 'POST', 
      headers, 
      body,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      let errMsg = `${provider.name} API error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        errMsg += ': ' + (errJson.error?.message || errJson.error?.type || errText);
      } catch {
        errMsg += ': ' + errText.slice(0, 200);
      }
      throw new Error(errMsg);
    }

    const json = await response.json();
    const content = provider.extractContent(json);
    if (!content) throw new Error(`Empty response from ${provider.name}`);
    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function listProviders() {
  // defaultModel 은 설정 화면이 모델 입력칸의 힌트로 쓴다 (프로바이더마다 표기가 달라
  // 사용자가 빈칸에서 무엇을 적어야 할지 알기 어렵다).
  return Object.entries(PROVIDERS).map(([key, p]) => ({
    id: key,
    name: p.name,
    defaultModel: p.defaultModel || '',
  }));
}

module.exports = { chat, listProviders, PROVIDERS };
