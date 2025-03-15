/**
 * 飞书多维表格工具 - 背景脚本
 * 负责监听剪贴板事件和URL变化，并发送数据到飞书多维表格
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
      // 通知用户，不显示系统通知
      showSuccessNotification(url, false);
    } else {
      console.error('添加数据失败:', result);
      showErrorNotification(url, result.msg || '未知错误', false);
    }
  } catch (error) {
    console.error('发送数据到飞书时出错:', error);
    showErrorNotification(url, error.message, false);
  }
}

/**
 * 显示成功通知
 * @param {string} url - 添加的URL
 * @param {boolean} [showSystemNotification=false] - 是否显示系统通知
 */
function showSuccessNotification(url, showSystemNotification = false) {
  // 如果不需要显示系统通知，则直接返回
  if (!showSystemNotification) {
    return;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: '飞书多维表格工具',
    message: 'URL已成功添加到飞书多维表格',
    contextMessage: url.length > 50 ? url.substring(0, 50) + '...' : url,
    buttons: [
      { title: '查看多维表格' }
    ],
    priority: 2
  }, (notificationId) => {
    // 存储通知ID和相关URL
    chrome.storage.local.set({ [notificationId]: { url: url, type: 'success' } });
  });
}

/**
 * 显示错误通知
 * @param {string} url - 尝试添加的URL
 * @param {string} error - 错误信息
 * @param {boolean} [showSystemNotification=false] - 是否显示系统通知
 */
function showErrorNotification(url, error, showSystemNotification = false) {
  // 如果不需要显示系统通知，则直接返回
  if (!showSystemNotification) {
    return;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: '飞书多维表格工具 - 错误',
    message: `添加URL失败: ${error}`,
    contextMessage: url.length > 50 ? url.substring(0, 50) + '...' : url,
    buttons: [
      { title: '重试' },
      { title: '查看设置' }
    ],
    priority: 2
  }, (notificationId) => {
    // 存储通知ID和相关URL
    chrome.storage.local.set({ [notificationId]: { url: url, type: 'error' } });
  });
}

// 监听通知按钮点击
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.storage.local.get([notificationId], (result) => {
    const data = result[notificationId];
    if (!data) return;

    if (data.type === 'success' && buttonIndex === 0) {
      // 打开飞书多维表格
      chrome.tabs.create({ url: `https://bitable.feishu.cn/app/${feishuConfig.appToken}/table/${feishuConfig.tableId}` });
    } else if (data.type === 'error') {
      if (buttonIndex === 0) {
        // 重试
        sendToFeishu(data.url);
      } else if (buttonIndex === 1) {
        // 打开设置页面
        chrome.runtime.openOptionsPage();
      }
    }

    // 清理存储的通知数据
    chrome.storage.local.remove(notificationId);
  });
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capturedUrl') {
    sendToFeishu(message.url);
    sendResponse({ status: 'received' });
  }
});