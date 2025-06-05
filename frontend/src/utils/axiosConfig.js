import axios from 'axios';

// 創建一個預先配置的axios實例，自動添加令牌
const setupAxios = () => {
  // 檢查本地存儲中的令牌
  const token = localStorage.getItem('token');
  
  if (token) {
    // 為所有請求設置默認headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // 設置請求攔截器，確保每次請求都有最新的令牌
  axios.interceptors.request.use(
    config => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers['Authorization'] = `Bearer ${currentToken}`;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
  
  // 設置響應攔截器來處理401錯誤
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        // 令牌過期或無效，可以在這裡處理登出邏輯
        console.log('Authentication token expired or invalid');
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        // window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxios;
