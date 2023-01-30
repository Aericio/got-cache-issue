import KeyvRedis from "@keyv/redis";
import got from "got";

const _got = (url: string, keyvredis: KeyvRedis) => {
    return got(new URL(url), {
        cache: keyvredis,
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
    const keyvredis = new KeyvRedis("redis://localhost:6379");

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
        await _got(urls[0]!, keyvredis);
        console.log("still alive");
    }

    for (let i = 0; i < 2; i++) {
        // jsonplaceholder -- works perfectly fine.
        // Uses Cloudflare -- cf-cache-status: HIT
        console.log("requesting");
        await _got(urls[1]!, keyvredis);
        console.log("still alive");
    }

    for (let i = 0; i < 2; i++) {
        // oneskyapp -- works perfectly fine.
        // Uses Cloudflare -- cf-cache-status: REVALIDATED
        console.log("requesting");
        await _got(urls[2]!, keyvredis);
        console.log("still alive");
    }

    // Comment out this test to see next test.
    // Once Danbooru has been added to the cache, it freezes.
    // Execute `FLUSHALL` on Redis to clear cache.
    for (let i = 0; i < 2; i++) {
        // Danbooru -- caches response on first request, but on second request, it freezes.
        // Uses Cloudflare -- cf-cache-status: DYNAMIC
        console.log("requesting");
        await _got(urls[3]!, keyvredis);
        console.log("still alive");
    }

    // Once Tatsu has been added to the cache, it freezes.
    // Execute `FLUSHALL` on Redis to clear cache.
    for (let i = 0; i < 2; i++) {
        // Tatsu -- caches response on first request, but on second request, it freezes.
        // Uses Cloudflare -- cf-cache-status: DYNAMIC
        console.log("requesting");
        await _got(urls[4]!, keyvredis);
        console.log("still alive");
    }
}

request();