/**
 * Sanitize and escape special characters in a string to be safely used in a RegExp
 * Prevents ReDoS (Regular Expression Denial of Service) and regex injection attacks.
 */
function escapeRegex(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = {
  escapeRegex,
};
