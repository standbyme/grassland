const config = {
    semaphore_timeout: 900000,
    // 900000ms is 15min
    redis: {
        host: '127.0.0.1',
        port: 32768
    }
}

function raw_connector() {
    const Redis = require('ioredis')
    const redis = new Redis(config.redis.port, config.redis.host)

    return redis
}

function connector() {
    const fs = require('fs')
    const config = {
        acquire_question_lua_script_path: './src/lua/acquire_question.lua'
    }
    const acquire_question_lua_script = fs.readFileSync(config.acquire_question_lua_script_path).toString()

    const redis = raw_connector()

    redis.defineCommand('acquire_question', {
        numberOfKeys: 0,
        lua: acquire_question_lua_script
    })

    return redis
}

function acquire_semaphore(redis, user_id, project_id, question_id, limit, timeout = config.semaphore_timeout) {
    return redis.acquire_semaphore(user_id, project_id, question_id, Date.now(), limit, timeout)
}

function acquire_question(redis, user_id, project_id, limit) {
    return redis.acquire_question(user_id, project_id, limit, Date.now())
}

exports.raw_connector = raw_connector
exports.connector = connector
exports.acquire_semaphore = acquire_semaphore
exports.acquire_question = acquire_question