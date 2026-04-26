git add .
git commit -m "feat(cache): add source cache on loadFrom() shared across all calls"
git commit -m "feat(cache): add ttl option on loadFrom() for cache expiry"
git commit -m "feat(cache): serve stale cache as fallback when fetch fails"
git commit -m "feat(cache): add clearCache(url?) to invalidate one or all cache entries"
git commit -m "feat(cache): add isCached(url) and cacheInfo(url) helpers"