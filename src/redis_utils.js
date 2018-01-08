const config = {
    semaphore_timeout: 900000,
    // 900000ms is 15min
    redis: {
        host: '127.0.0.1',
        port: 32768
    }
}
function define_command(redis) {
    const fs = require('fs')
    const util = require('util')
    const _ = require('lodash/string')

    const commands = [
        'acquire_question'
    ]

    const config = {
        lua_script_path: './src/lua/%s.lua'
    }

    commands.forEach((command_name) => {
        const command_lua_script_path = util.format(config.lua_script_path, command_name)
        const command_lua_script = fs.readFileSync(command_lua_script_path).toString()
        redis.defineCommand(command_name, {
            numberOfKeys: 0,
            lua: command_lua_script
        })
    })

    return redis
}
function raw_connector() {
    const Redis = require('ioredis')
    const redis = new Redis(config.redis.port, config.redis.host)

    return redis
}

function connector() {
    const redis = raw_connector()
    const redis_defined_command = define_command(redis)
    return redis_defined_command
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