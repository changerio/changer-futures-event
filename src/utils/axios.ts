import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

interface ApiResponse {
    data: any;
}

export function fetchData(url: string): Promise<ApiResponse> {
    return axios.get(url)
        .then((response: AxiosResponse) => {
            return { data: response.data } as ApiResponse;
        })
        .catch((error) => {
            throw error;
        });
}

export function postData(url: string, payload: any): Promise<ApiResponse> {
    const config: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    return axios.post(url, payload, config)
        .then((response: AxiosResponse) => {
            return { data: response.data } as ApiResponse;
        })
        .catch((error) => {
            throw error;
        });
}
