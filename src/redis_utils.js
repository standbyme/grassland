const config = {
    timeout: 900000
}

function connect() {
    const Redis = require('ioredis')
    const redis = new Redis(32768, '127.0.0.1')

    return redis
}

function acquire_semaphore(redis, user_id, project_id, question_id, limit, timeout = config.timeout) {
    return redis.acquire_semaphore(user_id, project_id, question_id, Date.now(), limit, timeout)
}

exports.connect = connect
exports.acquire_semaphore = acquire_semaphore 