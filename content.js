/**
 * 飞书多维表格工具 - 内容脚本
 * 负责监听页面上的URL复制和输入事件
 * @version 1.0.0
 */

// 监听复制事件
document.addEventListener('copy', async (event) => {
  try {
    // 获取选中的文本
    const selection = window.getSelection().toString().trim();

    // 检查是否是URL
    if (isValidUrl(selection)) {
      // 发送消息到背景脚本
      chrome.runtime.sendMessage({
        action: 'capturedUrl',
        url: selection
      });
    }
  } catch (error) {
    console.error('处理复制事件时出错:', error);
  }
});

// 监听粘贴事件
document.addEventListener('paste', async (event) => {
  try {
    // 获取剪贴板数据
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text').trim();

    // 检查是否是URL
    if (isValidUrl(pastedText)) {
      // 发送消息到背景脚本
      chrome.runtime.sendMessage({
        action: 'capturedUrl',
        url: pastedText
      });
    }
  } catch (error) {
    console.error('处理粘贴事件时出错:', error);
  }
});

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