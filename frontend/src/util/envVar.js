export const getEnvVar = (key) => {
    try {
        if (import.meta.env.DEV) {
            if (key === 'REACT_APP_API_URL') {
                return 'http://localhost:8000';
            }
            if (key === 'REACT_APP_DEBUG') {
                return 'true';
            }
        }
    }
    catch (error) {
        console.log(error);
    }
    return window.__ENV__?.[key] || "";
}

export const isDev = () => {
    try {
        return import.meta.env.DEV;
    }
    catch {
        return false;
    }
}