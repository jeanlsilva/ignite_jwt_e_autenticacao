import axios, { Axios, AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

interface FailedRequestsQueueInterface {
    onSuccess: (token: string) => void;
    onFailure: (error: AxiosError) => void;
}

let isRefreshing = false;
let failedRequestsQueue: FailedRequestsQueueInterface[] = [];

export function setupAPIClient(ctx: GetServerSidePropsContext | undefined = undefined) {
    let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`,
        },
    });
    
    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        if (error.response?.status === 401) {
            if (error.response?.data?.code === 'token.expired') {
                cookies = parseCookies(ctx);
    
                const { 'nextauth.refreshToken': refreshToken } = cookies;
                const originalConfig = error.config;
    
                if (!isRefreshing) {
                    isRefreshing = true;
    
                    api.post('/refresh', {
                        refreshToken,
                    }).then(response => {
                        const { token } = response.data;
        
                        setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 60 * 24 * 30, // 30 days
                            path: '/',
                        });
                        setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30, // 30 days
                            path: '/',
                        });
        
                        //@ts-ignore Element implicitly has an 'any' type because expression of type '"Authorization"' can't be used to index type 'HeadersDefaults'.Property 'Authorization' does not exist on type 'HeadersDefaults'.
                        api.defaults.headers['Authorization'] = `Bearer ${token}`;
    
                        failedRequestsQueue.forEach(request => request.onSuccess(token));
                        failedRequestsQueue = [];
                    }).catch(err => {
                        failedRequestsQueue.forEach(request => request.onFailure(err));
                        failedRequestsQueue = [];
    
                        if (process.browser) {
                            signOut();
                        }
                    })
                    .finally(() => {
                        isRefreshing = false;
                    })
                }
    
                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({
                        onSuccess: (token: string) => {
                            if (originalConfig.headers) {
                                originalConfig.headers['Authorization'] = `Bearer ${token}`
    
                                resolve(api(originalConfig));
                            }                        
                        },
                        onFailure: (error: AxiosError) => {
                            reject(error);
                        },
                    })
                })
            } else {
                if (process.browser) {
                    signOut();
                } else {
                    return Promise.reject(new AuthTokenError());
                }
            }
        }
    
        return Promise.reject(error);
    })

    return api;
}