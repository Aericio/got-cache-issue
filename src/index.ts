import KeyvRedis from "@keyv/redis";
import got from "got";

const cache = new KeyvRedis("redis://localhost:6379");
// const cache = new Map();
// Also reproducible when using Map as cache.

const _got = (url: string) => {
    return got(new URL(url), {
        cache,
        // Shared is set as false to allow `cache-control: private` responses to still cache.
        // The response would typically be ignored due to constraints in RFC7234#rfc.section.3
        // This does not affect my issue with caches causing freezes, regardless of true or false.
        // @see https://github.com/sindresorhus/got/issues/480
        cacheOptions: {shared: false},
    })
        .then((res) => console.log({
            url: res.url,
            cache: res.isFromCache,
            "cf-cache-status": res.headers["cf-cache-status"], // cloudflare cache
            "x-cache": res.headers["x-cache"] // GitHub varnish cache
        }))
}

async function request() {
    const urls = [
        "https://gist.githubusercontent.com/Aericio/3f20a5b4447b1ca6a7348f13987dc706/raw/d1a1001f17065a88acb71ff448de4a1a76db7077/data.json",
        "https://jsonplaceholder.typicode.com/todos/1",
        "https://support.oneskyapp.com/hc/en-us/article_attachments/202761727/example_2.json",
        "https://danbooru.donmai.us/posts.json",
        "https://tatsu.gg/lotties/tatsugotchi.json",
    ];

    // Run each request twice, to make sure the cache is working
    for (let i = 0; i < 2; i++) {
        // GitHub Gist -- works perfectly fine.
        // Using Varnish cache -- no cloudflare.
        console.log("requesting");
        await _got(urls[0]!);
        console.log("still alive");
        if (cache instanceof Map) console.log(cache.keys());
    }

    for (let i = 0; i < 2; i++) {
        // jsonplaceholder -- works perfectly fine.
        // Uses Cloudflare -- cf-cache-status: HIT
        console.log("requesting");
        await _got(urls[1]!);
        console.log("still alive");
        if (cache instanceof Map) console.log(cache.keys());
    }

    for (let i = 0; i < 2; i++) {
        // oneskyapp -- works perfectly fine.
        // Uses Cloudflare -- cf-cache-status: REVALIDATED
        console.log("requesting");
        await _got(urls[2]!);
        console.log("still alive");
        if (cache instanceof Map) console.log(cache.keys());
    }

    // Comment out this test to see next test.
    // Once Danbooru has been added to the cache, it freezes.
    // Execute `FLUSHALL` on Redis to clear cache.
    for (let i = 0; i < 2; i++) {
        // Danbooru -- caches response on first request, but on second request, it freezes.
        // Uses Cloudflare -- cf-cache-status: DYNAMIC
        console.log("requesting");
        await _got(urls[3]!);
        console.log("still alive");
        if (cache instanceof Map) console.log(cache.keys());
    }

    // Once Tatsu has been added to the cache, it freezes.
    // Execute `FLUSHALL` on Redis to clear cache.
    for (let i = 0; i < 2; i++) {
        // Tatsu -- caches response on first request, but on second request, it freezes.
        // Uses Cloudflare -- cf-cache-status: DYNAMIC
        console.log("requesting");
        await _got(urls[4]!);
        console.log("still alive");
        if (cache instanceof Map) console.log(cache.keys());
    }
}

request();