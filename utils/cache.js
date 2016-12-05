//var cacheManager = require('cache-manager');
//var redisStore = require('cache-manager-redis');

var properties = require('properties-reader')('properties.properties');

var redis = require("redis"),
client = redis.createClient({
	'host' : properties.get('rediscache.host'),
	'port' : properties.get('rediscache.port'),
	'db' : properties.get('rediscache.db')
});

module.exports.fetchItem = function(item_cache_key, item_id, cacheMissFetchLogic, processResult) {
	client.get(item_cache_key + '_' + item_id, function(err, reply) {
		if(reply) {
			processResult(reply);
		} else {
			cacheMissFetchLogic(item_id, function(result) {
				client.set(item_cache_key + '_' + item_id, JSON.stringify(result));
				processResult(result);
			});
		}
	});
};




//var redisCache = cacheManager.caching({
//	store : redisStore,
//	host : properties.get('rediscache.host'),
//	port : properties.get('rediscache.port'),
////	auth_pass : properties.get('rediscache.password'),
//	db : properties.get('rediscache.db'),
//	ttl : properties.get('rediscache.ttl') //Seconds
//});
//var memoryCache = cacheManager.caching({
//	store : 'memory',
//	max : properties.get('memcache.limit'),
//	ttl : properties.get('memcache.ttl') //Seconds
//});

//var multiCache = cacheManager.multiCaching([ memoryCache, redisCache ]);

//module.exports.fetchItem = (item_cache_key, item_id, cacheMissFetchLogic, processResult) => {
//	var cacheKey = item_cache_key + "_" + item_id;
//	memoryCache.wrap(cacheKey, (cacheCallback) => {
//		cacheMissFetchLogic(item_id, cacheCallback);
//	}, processResult);
//}

//module.exports.fetchItem = (item_cache_key, item_id, cacheMissFetchLogic, processResult) => {
//	var cacheKey = item_cache_key + "_" + item_id;
//	redisCache.wrap(cacheKey, (cacheCallback) => {
//		cacheMissFetchLogic(item_id, cacheCallback);
//	}, processResult);
//}