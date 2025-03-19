/**
 * 飞书多维表格工具 - 背景脚本
 * 负责监听URL变化，并发送数据到飞书多维表格
 * @version 1.0.0
 */

// 存储飞书API相关配置
let feishuConfig = {
  appId: '',
  appSecret: '',
  appToken: '',
  tableId: '',
  fieldName: '网址' // 默认字段名
};

// 初始化加载配置
chrome.storage.sync.get(['feishuConfig'], (result) => {
  if (result.feishuConfig) {
    feishuConfig = { ...feishuConfig, ...result.feishuConfig };
  }
});

// 监听存储变化，更新配置
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.feishuConfig) {
    feishuConfig = { ...feishuConfig, ...changes.feishuConfig.newValue };
  }
});

/**
 * 获取飞书的tenant_access_token
 * @returns {Promise<string>} 返回tenant_access_token
 */
async function getTenantAccessToken() {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: feishuConfig.appId,
        app_secret: feishuConfig.appSecret
      })
    });

    const result = await response.json();

    if (result.code === 0 && result.tenant_access_token) {
      return result.tenant_access_token;
    } else {
      console.error('获取tenant_access_token失败:', result);
      throw new Error('获取tenant_access_token失败');
    }
  } catch (error) {
    console.error('获取tenant_access_token时出错:', error);
    throw error;
  }
}

/**
 * 发送数据到飞书多维表格
 * @param {string} url - 要记录的URL
 */
async function sendToFeishu(url) {
  try {
    // 获取飞书配置
    const { feishuConfig } = await chrome.storage.sync.get(['feishuConfig']);

    if (!feishuConfig) {
      throw new Error('未找到飞书配置');
    }

    // 获取访问令牌
    const token = await getTenantAccessToken();

    // 构建请求数据
    const data = {
      fields: {
        [feishuConfig.fieldName]: url
      }
    };

    // 发送请求到飞书API
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.appToken}/tables/${feishuConfig.tableId}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    // 解析响应
    const result = await response.json();

    if (result.code === 0) {
      console.log('数据成功添加到飞书多维表格');
      // 通知用户
      notifyUI({
        type: 'success',
        title: '飞书多维表格工具',
        message: 'URL已成功添加到飞书多维表格',
        url: url
      });
    } else {
      console.error('添加数据失败:', result);
      notifyUI({
        type: 'error',
        title: '飞书多维表格工具 - 错误',
        message: `添加URL失败: ${result.msg || '未知错误'}`,
        url: url
      });
    }
  } catch (error) {
    console.error('发送数据到飞书时出错:', error);
    notifyUI({
      type: 'error',
      title: '飞书多维表格工具 - 错误',
      message: `添加URL失败: ${error.message}`,
      url: url
    });
  }
}

/**
 * 发送通知到UI
 * @param {Object} notificationData - 通知数据
 */
function notifyUI(notificationData) {
  // 存储通知数据到本地存储，以便popup打开时可以显示
  chrome.storage.local.set({ 'lastNotification': notificationData });

  // 向popup和content脚本发送消息
  chrome.runtime.sendMessage({
    action: 'showNotification',
    notification: notificationData
  });

  // 如果需要，可以尝试向当前激活的标签页发送消息
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showNotification',
        notification: notificationData
      }).catch(error => {
        // 内容脚本可能未加载，忽略错误
        console.log('无法向内容脚本发送通知:', error);
      });
    }
  });
}

// 打开飞书多维表格
function openFeishuBitable() {
  chrome.tabs.create({ url: `https://bitable.feishu.cn/app/${feishuConfig.appToken}/table/${feishuConfig.tableId}` });
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capturedUrl') {
    sendToFeishu(message.url);
    sendResponse({ status: 'received' });
  } else if (message.action === 'openFeishuBitable') {
    openFeishuBitable();
    sendResponse({ status: 'opening' });
  } else if (message.action === 'retryUrl' && message.url) {
    sendToFeishu(message.url);
    sendResponse({ status: 'retrying' });
  }
  return true; // 保持消息通道开放以便异步回应
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检查是否需要记录此URL（可以添加过滤逻辑）
    chrome.storage.sync.get(['autoCapture', 'excludedDomains'], (result) => {
      if (result.autoCapture === true) {
        // 检查是否在排除域名列表中
        const url = new URL(tab.url);
        const domain = url.hostname;

        const excludedDomains = result.excludedDomains || [];
        if (!excludedDomains.includes(domain)) {
          sendToFeishu(tab.url);
        }
      }
    });
  }
});