import axios, {
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig
} from "axios";

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const baseURL = rawBaseURL.endsWith("/api")
    ? rawBaseURL
    : `${rawBaseURL.replace(/\/$/, "")}/api`;

const request: AxiosInstance = axios.create({
    baseURL,
    timeout: 12000,
    headers: {
        "Content-Type": "application/json",
    },
});

// 请求拦截：自动携带token
request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // 修正：去掉参数内的类型标注
    const token = localStorage.getItem("vast_token") || localStorage.getItem("token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截：统一处理返回与错误
request.interceptors.response.use(
    (res: AxiosResponse) => res.data,
    (err: AxiosError) => {
        // 修正：删除无效 message: 语法
        console.error("接口请求错误：", err);
        return Promise.reject(err);
    }
);

export default request;
