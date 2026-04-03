import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // This will be proxied to http://localhost:5000/api by Vite
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Optional: Redirect to login or clear local storage
            // localStorage.removeItem('userInfo');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
