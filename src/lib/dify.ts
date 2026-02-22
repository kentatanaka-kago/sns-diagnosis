import 'server-only';
import axios from 'axios';

// APIキーから余分な空白や改行を除去
const difyApiKey = (process.env.DIFY_API_KEY || '').trim();
const difyApiUrl = (process.env.DIFY_API_URL || '').trim();

if (!difyApiKey) {
  throw new Error('Missing DIFY_API_KEY environment variable');
}

if (!difyApiUrl) {
  throw new Error('Missing DIFY_API_URL environment variable. Please set DIFY_API_URL in .env.local');
}

if (!difyApiKey.startsWith('app-')) {
  console.warn('Warning: Dify API key format may be invalid');
}

export interface DifyChatMessageRequest {
  inputs: {
    profile_context: string;
    mode?: string;
  };
  query?: string;
  user: string;
  response_mode?: 'blocking' | 'streaming';
}

export interface DifyChatMessageResponse {
  answer: string;
  [key: string]: unknown;
}

export async function sendDifyChatMessage(
  request: DifyChatMessageRequest
): Promise<string> {
  try {
    // ワークフローアプリ用のリクエストボディを構築
    // queryは必須パラメータなので、明示的に設定
    const requestBody = {
      inputs: request.inputs,
      query: request.query || 'このアカウントのInstagram診断をお願いします。', // 必須パラメータ
      user: request.user || 'api-user', // デフォルト値を設定
      response_mode: request.response_mode || 'blocking', // デフォルト値を設定
    };

    // リクエストヘッダーを構築
    const headers = {
      Authorization: `Bearer ${difyApiKey}`,
      'Content-Type': 'application/json',
    };

    // エンドポイントURLを構築（末尾に/chat-messagesを追加）
    const endpointUrl = difyApiUrl.endsWith('/chat-messages') 
      ? difyApiUrl 
      : `${difyApiUrl.replace(/\/$/, '')}/chat-messages`;

    console.log('Dify API request:', {
      url: endpointUrl,
      inputs: Object.keys(request.inputs),
      hasQuery: !!requestBody.query,
    });

    const response = await axios.post<DifyChatMessageResponse>(
      endpointUrl,
      requestBody,
      {
        headers,
      }
    );

    console.log('Dify API response status:', response.status);
    
    // レスポンスからanswerを取得（複数の形式に対応）
    // ワークフローアプリの場合は、outputsの中にanswerが含まれる可能性がある
    let answer = '';
    
    if (response.data.answer) {
      answer = response.data.answer;
    } else if ((response.data as any).text) {
      answer = (response.data as any).text;
    } else if ((response.data as any).outputs) {
      // ワークフローアプリの場合、outputsの中にanswerが含まれる可能性がある
      const outputs = (response.data as any).outputs;
      answer = outputs.answer || outputs.text || outputs.result || '';
    } else if (typeof response.data === 'string') {
      answer = response.data;
    }
    
    if (!answer || !answer.trim()) {
      console.error('Dify API response does not contain answer field. Keys:', Object.keys(response.data));
      throw new Error('Dify APIから診断結果が返されませんでした。');
    }
    
    return answer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message;
      
      console.error('Dify API error details:', {
        status,
        errorMessage,
      });

      if (status === 401) {
        console.error('Dify API authentication failed (401)');
        throw new Error('Dify API認証エラー: APIキーが無効または設定されていません。');
      }

      throw new Error(
        `Dify API error: ${status} - ${errorMessage}`
      );
    }
    throw error;
  }
}
