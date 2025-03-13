/**
 * 飞书多维表格工具 - 弹出窗口脚本
 * 负责弹出窗口的交互逻辑
 * @version 1.0.0
 */

// DOM元素
const statusElement = document.getElementById('status');
const autoCaptureCheckbox = document.getElementById('autoCapture');
const currentUrlInput = document.getElementById('currentUrl');
const captureButton = document.getElementById('captureButton');
const optionsButton = document.getElementById('optionsButton');

/**
 * 更新状态显示
 * @param {string} message - 状态消息
 * @param {string} type - 状态类型: 'success', 'error', 'info', 'warning'
 */
function updateStatus(message, type = 'info') {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

/**
 * 检查配置是否完整
 * @param {Object} feishuConfig - 飞书配置对象
 * @returns {boolean} 配置是否完整
 */
function isConfigComplete(feishuConfig) {
  return !!(feishuConfig &&
    feishuConfig.appId &&
    feishuConfig.appSecret &&
    feishuConfig.appToken &&
    feishuConfig.tableId &&
    feishuConfig.fieldName);
}

/**
 * 更新UI状态
 */
function updateUIState() {
  chrome.storage.sync.get(['feishuConfig', 'autoCapture'], (result) => {
    // 检查飞书配置是否完整
    const feishuConfig = result.feishuConfig || {};
    if (isConfigComplete(feishuConfig)) {
      updateStatus('配置已完成，插件正常运行中', 'success');
      captureButton.disabled = false;
    } else {
      updateStatus('请先完成飞书API配置', 'error');
      captureButton.disabled = true;
    }

    // 设置自动捕获开关状态
    autoCaptureCheckbox.checked = result.autoCapture === true;
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页URL
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0] && tabs[0].url) {
    currentUrlInput.value = tabs[0].url;
  }

  // 初始化UI状态
  updateUIState();
});

// 监听存储变化，更新UI状态
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.feishuConfig || changes.autoCapture)) {
    updateUIState();
  }
});

// 自动捕获开关事件
autoCaptureCheckbox.addEventListener('change', () => {
  chrome.storage.sync.set({ autoCapture: autoCaptureCheckbox.checked });

  // 显示通知
  if (autoCaptureCheckbox.checked) {
    showSuccessNotification('自动捕获已启用', '插件将自动记录您浏览的URL');
  } else {
    showInfoNotification('自动捕获已禁用', '您可以手动添加URL或重新启用自动捕获');
  }
});

// 手动添加当前URL按钮事件
captureButton.addEventListener('click', async () => {
  const url = currentUrlInput.value;
  if (url) {
    try {
      // 显示加载状态
      captureButton.disabled = true;
      captureButton.innerHTML = `
        <span class="loading"></span>
        <span>正在添加...</span>
      `;

      // 发送消息到背景脚本
      const response = await chrome.runtime.sendMessage({
        action: 'capturedUrl',
        url: url
      });

      if (response && response.status === 'received') {
        updateStatus('URL已成功添加到飞书多维表格', 'success');
        showSuccessNotification('添加成功', 'URL已成功添加到飞书多维表格');
      }
    } catch (error) {
      updateStatus('添加URL失败: ' + error.message, 'error');
      showErrorNotification('添加失败', '无法添加URL: ' + error.message);
    } finally {
      // 恢复按钮状态
      captureButton.disabled = false;
      captureButton.innerHTML = `
        <span class="button-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </span>
        手动添加当前URL
      `;
    }
  }
});

// 设置按钮事件
optionsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});