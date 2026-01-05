// Track backend connectivity status globally
let backendOffline = false;

export function isBackendOffline() {
    return backendOffline;
}

export function setBackendOffline(status: boolean) {
    backendOffline = status;
    if (status) {
        console.warn('Backend declared offline. Falling back to local storage.');
    }
}
