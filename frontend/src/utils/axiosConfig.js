import axios from 'axios';

// 簡化的 axios 配置，不使用 JWT
const setupAxios = () => {
  // 設置 API 基礎 URL
  axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://final-form-u0o0.onrender.com' 
    : 'http://localhost:5000';
    
  // 設置請求攔截器，添加通用配置
  axios.interceptors.request.use(
    config => {
      // 確保請求有正確的 Content-Type
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
      
      // 從 localStorage 獲取當前用戶信息
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // 如果是 POST/PUT 請求，自動添加 student_id
          if ((config.method === 'post' || config.method === 'put') && config.data) {
            // 如果是對象，添加 student_id
            if (typeof config.data === 'object' && !Array.isArray(config.data)) {
              config.data.student_id = user.id;
            }
          }
          // 如果是 GET 請求，添加到查詢參數
          if (config.method === 'get') {
            config.params = config.params || {};
            if (!config.params.student_id) {
              config.params.student_id = user.id;
            }
          }
        } catch (e) {
          // 移除未定義的 setError 調用，使用靜默錯誤處理
          // 在攔截器中發生錯誤不應該影響應用程序的整體狀態
        }
      }
      
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
  
};

export default setupAxios;