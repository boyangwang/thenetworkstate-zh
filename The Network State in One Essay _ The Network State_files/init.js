const revisionSuffix = "3";

// Manages the display for the initial loader, which shows up while react
// is downloading, etc.
const waitForEvent = function (eventName, eventObj) {
    return new Promise(resolve => {
        eventObj.addEventListener(eventName, resolve, { once: true });
    });
};

const waitForDOMContentLoaded = function () {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        return Promise.resolve(null);
    } else {
        return waitForEvent('DOMContentLoaded', window);
    }
};

(async function() {
    if (navigator.serviceWorker) {
        const etagLookup = fetch('/book-live.json', { cache: 'no-store', method: 'HEAD' });

        await navigator.serviceWorker.register(document.location.origin + '/book-service-worker.js');
        await navigator.serviceWorker.ready;
        const response = await etagLookup;

        // Can't use etag due to CORS, assume size + modified date is a key
        const key = response.headers.get('content-length') + response.headers.get('last-modified');
        const arr = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder("utf-8").encode(key))));
        const revision = arr.map((bytes) => bytes.toString(16).padStart(2, '0')).join('') + revisionSuffix;

        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'set-revision',
                revision,
            });
        }
    }
})();
