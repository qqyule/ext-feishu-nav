/**
 * 飞书多维表格工具 - 内容脚本
 * @version 1.0.0
 */

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