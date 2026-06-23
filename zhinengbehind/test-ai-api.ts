// zhinengbehind/test-ai-api.ts
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const API_KEY = process.env.QWEN_API_KEY || '';
const MODEL = process.env.QWEN_MODEL || 'qwen-max';

console.log('=== Qwen AI API 连接测试 ===\n');
console.log('API URL:', API_BASE_URL);
console.log('模型:', MODEL);
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 15)}...` : '未配置');
console.log('');

async function testBasicConnection() {
  console.log('📡 测试 1: 基础连接测试...');
  
  try {
    if (!API_KEY) {
      throw new Error('API Key 未配置');
    }

    const response = await axios.post(
      API_BASE_URL,
      {
        model: MODEL,
        messages: [
          { role: 'user', content: '你好，请回复"连接成功"以确认API正常工作' }
        ],
        temperature: 0.7,
        max_tokens: 100,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    const usage = response.data.usage;

    console.log('✅ 连接成功！');
    console.log('   AI 回复:', content?.substring(0, 100));
    console.log('   Token 使用:', {
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_tokens: usage?.total_tokens
    });
    console.log('');
    
    return true;
  } catch (error: any) {
    console.log('❌ 连接失败！');
    if (error.response) {
      console.log('   错误状态码:', error.response.status);
      console.log('   错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('   错误:', error.message);
    }
    console.log('');
    return false;
  }
}

async function testDisclosureGeneration() {
  console.log('📝 测试 2: 交底书生成功能...');
  
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        model: MODEL,
        messages: [
          { 
            role: 'system', 
            content: '你是一位专业的专利工程师，擅长将不完整的技术描述转换为结构化的技术交底书。' 
          },
          { 
            role: 'user', 
            content: '技术领域：智能家居\n\n原始技术描述：一种基于语音识别的自动灯光控制系统，可以通过识别用户的语音指令来控制房间灯光的开关和亮度。' 
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    console.log('✅ 交底书生成成功！');
    console.log('   生成内容长度:', content?.length, '字符');
    console.log('   内容预览:', content?.substring(0, 150) + '...');
    console.log('');
    
    return true;
  } catch (error: any) {
    console.log('❌ 交底书生成失败！');
    if (error.response) {
      console.log('   错误状态码:', error.response.status);
      console.log('   错误信息:', error.response.data.error?.message || JSON.stringify(error.response.data));
    } else {
      console.log('   错误:', error.message);
    }
    console.log('');
    return false;
  }
}

async function testAIRateDetection() {
  console.log('🔍 测试 3: AI 率检测功能...');
  
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        model: MODEL,
        messages: [
          { 
            role: 'system', 
            content: '你是一位专业的文本分析专家，擅长识别文本是否由 AI 生成。请分析给定文本的 AI 生成概率。输出格式：AI生成率：XX%' 
          },
          { 
            role: 'user', 
            content: '请分析以下文本的 AI 生成率：本发明提供了一种智能控制系统，包括传感器模块、处理模块和执行模块。' 
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    console.log('✅ AI 率检测成功！');
    console.log('   检测结果:', content?.substring(0, 150));
    console.log('');
    
    return true;
  } catch (error: any) {
    console.log('❌ AI 率检测失败！');
    if (error.response) {
      console.log('   错误状态码:', error.response.status);
      console.log('   错误信息:', error.response.data.error?.message || JSON.stringify(error.response.data));
    } else {
      console.log('   错误:', error.message);
    }
    console.log('');
    return false;
  }
}

async function runAllTests() {
  const results = {
    basicConnection: false,
    disclosureGeneration: false,
    aiRateDetection: false,
  };

  results.basicConnection = await testBasicConnection();
  
  if (results.basicConnection) {
    results.disclosureGeneration = await testDisclosureGeneration();
    results.aiRateDetection = await testAIRateDetection();
  }

  console.log('=== 测试结果汇总 ===');
  console.log('基础连接测试:', results.basicConnection ? '✅ 通过' : '❌ 失败');
  console.log('交底书生成测试:', results.disclosureGeneration ? '✅ 通过' : '❌ 失败');
  console.log('AI 率检测测试:', results.aiRateDetection ? '✅ 通过' : '❌ 失败');
  console.log('');

  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('🎉 所有测试通过！AI API 正常工作。');
  } else {
    console.log('⚠️  部分测试失败，请检查配置和网络连接。');
  }
}

runAllTests().catch(err => {
  console.error('测试执行错误:', err);
});
