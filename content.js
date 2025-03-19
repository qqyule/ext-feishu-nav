/**
 * 飞书多维表格工具 - 内容脚本
 * 负责监听页面上的URL输入事件
 * @version 1.0.0
 */

// 监听输入事件
// 这部分功能主要依赖于background.js中的标签页更新事件

/**
 * 检查字符串是否是有效的URL
 * @param {string} str - 要检查的字符串
 * @returns {boolean} - 是否是有效URL
 */
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// 添加通知样式
function injectNotificationStyles() {
  // 检查是否已经添加了样式
  if (document.getElementById('feishu-nav-notification-styles')) {
    return;
  }

  // 创建样式元素
  const style = document.createElement('style');
  style.id = 'feishu-nav-notification-styles';
  style.textContent = `
    .feishu-nav-notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 300px;
    }
    .feishu-nav-notification {
      background-color: #fff;
      color: #333;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 10px;
      padding: 12px;
      display: flex;
      align-items: flex-start;
      overflow: hidden;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    }
    .feishu-nav-notification.show {
      opacity: 1;
      transform: translateX(0);
    }
    .feishu-nav-notification.success {
      border-left: 4px solid #52c41a;
    }
    .feishu-nav-notification.error {
      border-left: 4px solid #f5222d;
    }
    .feishu-nav-notification.warning {
      border-left: 4px solid #faad14;
    }
    .feishu-nav-notification.info {
      border-left: 4px solid #1890ff;
    }
    .feishu-nav-notification-icon {
      margin-right: 12px;
      color: #333;
    }
    .feishu-nav-notification-content {
      flex: 1;
    }
    .feishu-nav-notification-title {
      font-weight: bold;
      margin-bottom: 4px;
    }
    .feishu-nav-notification-message {
      font-size: 14px;
    }
    .feishu-nav-notification-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
      opacity: 0.5;
      transition: opacity 0.2s;
    }
    .feishu-nav-notification-close:hover {
      opacity: 1;
    }
  `;

  // 添加到文档头部
  document.head.appendChild(style);

  // 创建通知容器
  const container = document.createElement('div');
  container.className = 'feishu-nav-notification-container';
  container.id = 'feishu-nav-notification-container';
  document.body.appendChild(container);
}

/**
 * 在页面上显示通知
 * @param {Object} notification - 通知数据对象
 */
function showNotification(notification) {
  // 确保样式和容器已经注入
  injectNotificationStyles();

  const container = document.getElementById('feishu-nav-notification-container');
  if (!container) return;

  const { type, title, message } = notification;

  // 创建通知元素
  const notificationEl = document.createElement('div');
  notificationEl.className = `feishu-nav-notification ${type || 'info'}`;

  // 设置图标
  let iconSvg = '';
  switch (type) {
    case 'success':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'error':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    case 'warning':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      break;
    default:
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  // 设置内容
  notificationEl.innerHTML = `
    <div class="feishu-nav-notification-icon">${iconSvg}</div>
    <div class="feishu-nav-notification-content">
      <div class="feishu-nav-notification-title">${title || ''}</div>
      <div class="feishu-nav-notification-message">${message || ''}</div>
    </div>
    <button class="feishu-nav-notification-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // 添加到容器
  container.appendChild(notificationEl);

  // 应用动画
  setTimeout(() => {
    notificationEl.classList.add('show');
  }, 10);

  // 关闭按钮点击事件
  const closeButton = notificationEl.querySelector('.feishu-nav-notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      notificationEl.classList.remove('show');
      setTimeout(() => {
        if (notificationEl.parentNode) {
          notificationEl.parentNode.removeChild(notificationEl);
        }
      }, 300);
    });
  }

  // 自动关闭
  setTimeout(() => {
    if (notificationEl.parentNode) {
      notificationEl.classList.remove('show');
      setTimeout(() => {
        if (notificationEl.parentNode) {
          notificationEl.parentNode.removeChild(notificationEl);
        }
      }, 300);
    }
  }, 5000);

  return notificationEl;
}

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showNotification' && message.notification) {
    showNotification(message.notification);
    sendResponse({ status: 'notification_shown' });
  }
  return true; // 保持消息通道开放以便异步回应
});

// 监听表单提交事件，可能包含URL
document.addEventListener('submit', (event) => {
  try {
    const form = event.target;
    const inputs = form.querySelectorAll('input[type="text"], input[type="url"], input[type="search"]');

    inputs.forEach(input => {
      const value = input.value.trim();
      if (isValidUrl(value)) {
        chrome.runtime.sendMessage({
          action: 'capturedUrl',
          url: value
        });
      }
    });
  } catch (error) {
    console.error('处理表单提交事件时出错:', error);
  }
});
