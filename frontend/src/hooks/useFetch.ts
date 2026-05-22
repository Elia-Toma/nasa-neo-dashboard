export const createFetchClient = () => {
    // We assume the Vite env variable is set, otherwise fallback to local backend
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

    const originalRequest = async (url: string, config: RequestInit) => {
        try {
            const response = await fetch(url, config);

            // Handle HTTP errors (e.g., 400, 404, 502) before attempting to parse JSON
            if (!response.ok) {
                let errorDetail = 'API request failed';
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch {
                    // Fallback if response is not JSON
                    errorDetail = response.statusText;
                }
                throw new Error(`Error ${response.status}: ${errorDetail}`);
            }

            const data = await response.json();
            return { response, data };

        } catch (error) {
            console.error("Network or parsing error in useFetch:", error);
            throw error;
        }
    };

    const callFetch = async (endpoint: string, options: RequestInit = {}) => {
        // Construct full URL if a relative path is passed
        const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            }
        };

        const { response, data } = await originalRequest(url, config);
        return { response, data };
    };

    return callFetch;
};

export const useFetch = createFetchClient;

export default createFetchClient;
