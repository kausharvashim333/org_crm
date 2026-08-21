export const getApiErrorMessage = (err, fallback = 'Something went wrong') => {
  if (!err) return fallback;

  if (err.response?.data?.message) return err.response.data.message;

  if (err.response?.status === 404) return 'Resource not found';
  if (err.response?.status === 413) return 'File too large. Max size is 50MB.';
  if (err.response?.status === 429) return 'Too many requests. Please slow down.';
  if (err.response?.status >= 500) return 'Server error. Please try again in a moment.';

  if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (err.code === 'ERR_NETWORK') return 'Network error. Check your internet connection.';

  if (err.message) return err.message;

  return fallback;
};

export const handleApiError = (err, showError, fallbackMsg) => {
  const msg = getApiErrorMessage(err, fallbackMsg);
  if (showError) showError(msg);
  else console.error('[API Error]', msg, err);
  return msg;
};
