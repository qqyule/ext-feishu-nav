/**
 * 飞书多维表格自动化插件 - 通知工具函数
 * 提供统一的通知显示功能
 */

/**
 * 显示通知
 * @param {Object} options - 通知选项
 * @param {string} options.type - 通知类型: 'success', 'error', 'warning', 'info'
 * @param {string} options.title - 通知标题
 * @param {string} options.message - 通知内容
 * @param {number} [options.duration=3000] - 通知显示时间（毫秒）
 * @param {Function} [options.onClose] - 通知关闭时的回调函数
 * @returns {HTMLElement} 通知元素
 */
function showNotification(options) {
  // 默认值
  const defaultOptions = {
    type: 'info',
    title: '',
    message: '',
    duration: 3000,
    onClose: null
  };

  // 合并选项
  const settings = { ...defaultOptions, ...options };

  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification ${settings.type}`;

  // 获取图标
  let iconSvg = '';
  switch (settings.type) {
    case 'success':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'error':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    case 'warning':
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      break;
    case 'info':
    default:
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      break;
  }

  // 设置通知内容
  notification.innerHTML = `
    <div class="notification-icon">${iconSvg}</div>
    <div class="notification-content">
      <div class="notification-title">${settings.title}</div>
      <div class="notification-message">${settings.message}</div>
    </div>
    <button class="notification-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // 添加到文档
  document.body.appendChild(notification);

  // 关闭按钮事件
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    closeNotification();
  });

  // 关闭通知函数
  const closeNotification = () => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';

    // 动画结束后移除元素
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);

        // 执行关闭回调
        if (typeof settings.onClose === 'function') {
          settings.onClose();
        }
      }
    }, 300);
  };

  // 自动关闭
  if (settings.duration > 0) {
    setTimeout(() => {
      closeNotification();
    }, settings.duration);
  }

  return notification;
}

/**
 * 显示成功通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {number} [duration=3000] - 通知显示时间（毫秒）
 * @param {Function} [onClose] - 通知关闭时的回调函数
 * @returns {HTMLElement} 通知元素
 */
function showSuccessNotification(title, message, duration = 3000, onClose = null) {
  return showNotification({
    type: 'success',
    title,
    message,
    duration,
    onClose
  });
}

/**
 * 显示错误通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {number} [duration=3000] - 通知显示时间（毫秒）
 * @param {Function} [onClose] - 通知关闭时的回调函数
 * @returns {HTMLElement} 通知元素
 */
function showErrorNotification(title, message, duration = 3000, onClose = null) {
  return showNotification({
    type: 'error',
    title,
    message,
    duration,
    onClose
  });
}

/**
 * 显示警告通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {number} [duration=3000] - 通知显示时间（毫秒）
 * @param {Function} [onClose] - 通知关闭时的回调函数
 * @returns {HTMLElement} 通知元素
 */
function showWarningNotification(title, message, duration = 3000, onClose = null) {
  return showNotification({
    type: 'warning',
    title,
    message,
    duration,
    onClose
  });
}

/**
 * 显示信息通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {number} [duration=3000] - 通知显示时间（毫秒）
 * @param {Function} [onClose] - 通知关闭时的回调函数
 * @returns {HTMLElement} 通知元素
 */
function showInfoNotification(title, message, duration = 3000, onClose = null) {
  return showNotification({
    type: 'info',
    title,
    message,
    duration,
    onClose
  });
}