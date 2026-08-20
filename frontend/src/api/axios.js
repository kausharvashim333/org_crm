import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const path = window.location.pathname;
  let token = null;

  if (path.startsWith('/admin') && !path.includes('/login')) {
    token = localStorage.getItem('admin_token');
  } else if (path.startsWith('/partner') && !path.includes('/login')) {
    token = localStorage.getItem('partner_token');
  } else if (path.startsWith('/student') && !path.includes('/login')) {
    token = localStorage.getItem('student_token');
  } else {
    // On public and login routes, do not send stale portal tokens
    token = null;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || '';
      const isTokenInvalid = msg.includes('token') || msg.includes('no token') || msg.includes('authorized');
      const isUserGone = msg.includes('User not found') || msg.includes('deactivated');
      
      if (isTokenInvalid) {
        const path = window.location.pathname;
        if (path.startsWith('/admin') && !path.includes('/login')) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/admin/login';
        } else if (path.startsWith('/partner') && !path.includes('/login')) {
          localStorage.removeItem('partner_token');
          localStorage.removeItem('partner_user');
          window.location.href = '/partner/login';
        } else if (path.startsWith('/student') && !path.includes('/login')) {
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_user');
          window.location.href = '/student/login';
        }
      } else if (isUserGone) {
        const path = window.location.pathname;
        if (path.startsWith('/admin') && !path.includes('/login')) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/admin/login';
        } else if (path.startsWith('/partner') && !path.includes('/login')) {
          localStorage.removeItem('partner_token');
          localStorage.removeItem('partner_user');
          window.location.href = '/partner/login';
        } else if (path.startsWith('/student') && !path.includes('/login')) {
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_user');
          window.location.href = '/student/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
