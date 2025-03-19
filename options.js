/**
 * 飞书多维表格工具 - 选项页面脚本
 * 负责处理用户配置的保存和加载
 * @version 1.0.0
 */

// DOM元素
const appIdInput = document.getElementById('appId');
const appSecretInput = document.getElementById('appSecret');
const appTokenInput = document.getElementById('appToken');
const tableIdInput = document.getElementById('tableId');
const fieldNameInput = document.getElementById('fieldName');
const saveButton = document.getElementById('saveButton');
const testButton = document.getElementById('testButton');
const statusDiv = document.getElementById('status');

// 默认配置
const defaultConfig = {
  appId: '',
  appSecret: '',
  appToken: '',
  tableId: '',
  fieldName: '网址'
};

/**
 * 加载保存的配置
 */
function loadSavedConfig() {
  chrome.storage.sync.get(['feishuConfig'], (result) => {
    const config = result.feishuConfig || {};

    // 填充表单
    appIdInput.value = config.appId || defaultConfig.appId;
    appSecretInput.value = config.appSecret || defaultConfig.appSecret;
    appTokenInput.value = config.appToken || defaultConfig.appToken;
    tableIdInput.value = config.tableId || defaultConfig.tableId;
    fieldNameInput.value = config.fieldName || defaultConfig.fieldName;
  });
}

/**
 * 保存配置
 */
function saveConfig() {
  // 显示加载状态
  saveButton.disabled = true;
  saveButton.innerHTML = `
    <span class="loading"></span>
    <span>保存中...</span>
  `;

  const config = {
    appId: appIdInput.value.trim(),
    appSecret: appSecretInput.value.trim(),
    appToken: appTokenInput.value.trim(),
    tableId: tableIdInput.value.trim(),
    fieldName: fieldNameInput.value.trim() || defaultConfig.fieldName
  };

  // 保存飞书配置
  chrome.storage.sync.set({
    feishuConfig: config
  }, () => {
    // 恢复按钮状态
    saveButton.disabled = false;
    saveButton.innerHTML = `
      <span class="button-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      </span>
      保存设置
    `;

    // 显示成功通知
    showSuccessNotification('保存成功', '设置已成功保存');
  });
}

/**
 * 测试飞书API连接
 */
async function testConnection() {
  try {
    // 显示加载状态
    testButton.disabled = true;
    testButton.innerHTML = `
      <span class="loading"></span>
      <span>测试中...</span>
    `;

    updateStatus('正在测试连接...', 'info');

    // 获取表单中的值
    const appId = appIdInput.value.trim();
    const appSecret = appSecretInput.value.trim();
    const appToken = appTokenInput.value.trim();
    const tableId = tableIdInput.value.trim();

    // 检查必填字段
    if (!appId || !appSecret || !appToken || !tableId) {
      throw new Error('请填写所有必填字段');
    }

    // 获取tenant_access_token
    const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const tokenResult = await tokenResponse.json();

    if (tokenResult.code !== 0) {
      throw new Error(`获取Token失败: ${tokenResult.msg}`);
    }

    const token = tokenResult.tenant_access_token;

    // 测试表格访问 - 更新API地址
    const testResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const testResult = await testResponse.json();

    if (testResult.code === 0) {
      const tableName = testResult.data?.table?.name || testResult.data?.items?.[0]?.fields?.['标题'] || '未知';
      updateStatus('连接成功！多维表格访问正常', 'success');
      showSuccessNotification('连接成功', `成功连接到飞书多维表格`);
    } else {
      throw new Error(`访问表格失败: ${testResult.msg}`);
    }
  } catch (error) {
    updateStatus(`连接测试失败: ${error.message}`, 'error');
    showErrorNotification('连接失败', error.message);
    console.error('测试连接时出错:', error);
  } finally {
    // 恢复按钮状态
    testButton.disabled = false;
    testButton.innerHTML = `
      <span class="button-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </span>
      测试连接
    `;
  }
}

/**
 * 更新状态显示
 * @param {string} message - 状态消息
 * @param {string} type - 状态类型: 'success', 'error', 'info', 'warning'
 */
function updateStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  // 如果是成功或错误消息，3秒后自动隐藏
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
  loadSavedConfig();

  // 初始化提示图标
  initTooltips();
});

/**
 * 初始化提示图标
 */
function initTooltips() {
  // 获取所有带有data-tooltip-image属性的提示图标
  const tooltipIcons = document.querySelectorAll('.tooltip-icon[data-tooltip-image]');

  // 为每个提示图标添加鼠标事件
  tooltipIcons.forEach(icon => {
    // 创建图片预加载
    const imagePath = icon.getAttribute('data-tooltip-image');
    if (imagePath) {
      const img = new Image();
      img.src = imagePath;
    }
  });
}

saveButton.addEventListener('click', saveConfig);
testButton.addEventListener('click', testConnection);
addDomainButton.addEventListener('click', () => addDomain(newDomainInput.value));
newDomainInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomain(newDomainInput.value);
  }
});

/**
 * 监听来自background.js的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showNotification' && message.notification) {
    const { type, title, message: notificationMessage } = message.notification;

    if (type === 'success') {
      showSuccessNotification(title, notificationMessage);
    } else if (type === 'error') {
      showErrorNotification(title, notificationMessage);
    } else if (type === 'warning') {
      showWarningNotification(title, notificationMessage);
    } else if (type === 'info') {
      showInfoNotification(title, notificationMessage);
    }

    sendResponse({ status: 'notification_shown' });
  }
  return true; // 保持消息通道开放以便异步回应
});
