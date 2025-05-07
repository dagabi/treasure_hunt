export const getEnvVar = (key) => {
    return window.__ENV__?.[key] || "";
}