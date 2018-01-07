const config = {
    timeout: 900000
}

function raw_connector() {
    const Redis = require('ioredis')
    const redis = new Redis(32768, '127.0.0.1')

    return redis
}

function connector() {
    const redis = raw_connector()
    // redis.defineCommand('acquire_semaphore', {
    //     numberOfKeys: 0,
    //     lua: acquire_semaphore_lua_script
    // })
    return redis
}

function acquire_semaphore(redis, user_id, project_id, question_id, limit, timeout = config.timeout) {
    return redis.acquire_semaphore(user_id, project_id, question_id, Date.now(), limit, timeout)
}

exports.raw_connector = raw_connector
exports.acquire_semaphore = acquire_semaphore 