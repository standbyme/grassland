import * as Redis from 'ioredis'

const redis_config = {
    semaphore_timeout: 900000,
    // 900000ms is 15min
    redis: {
        host: '127.0.0.1',
        port: 6379
    }
}
function define_command(redis: Redis.Redis) {
    const fs = require('fs')
    const util = require('util')
    const _ = require('lodash')

    interface CommandsInterface {
        [propName: string]: string[]
    }

    const commands: CommandsInterface = {
        'acquire_question_back': ['acquire_semaphore'],
        'temp_acquire_question': []
    }

    const config = {
        lua_script_path: './src/lua/%s.lua'
    }

    _.forOwn(commands, function (dependencies: string[], command_name: string) {
        const main_command_lua_script_path = util.format(config.lua_script_path, command_name)
        const main_command_lua_script = fs.readFileSync(main_command_lua_script_path).toString()
        const command_lua_script = (() => {
            if (_.isEmpty(dependencies)) {
                return main_command_lua_script
            } else {
                const dependency_command_name_with_file_content__list = dependencies.map((dependency_command_name) => {
                    const dependency_command_lua_script_path = util.format(config.lua_script_path, dependency_command_name)
                    const dependency_command_lua_script = fs.readFileSync(dependency_command_lua_script_path).toString()
                    return { [dependency_command_name]: dependency_command_lua_script }
                })

                const dependency_command_name_with_file_content = _.merge(...dependency_command_name_with_file_content__list)

                // dependencies is like ['acquire_question']
                // dependency_command_name_with_file_content is like {'acquire_question':the file content}
                const compiled = _.template(main_command_lua_script)
                return compiled(dependency_command_name_with_file_content)
            }
        })()

        redis.defineCommand(command_name, {
            numberOfKeys: 0,
            lua: command_lua_script
        })
    })

    return redis
}
/* tslint:disable:variable-name*/
function raw_connector(): Redis.Redis {
    const redis = new Redis(redis_config.redis.port, redis_config.redis.host)

    return redis
}
/* tslint:enable:variable-name*/

function connector() {
    const redis = raw_connector()
    const redis_defined_command = define_command(redis)
    return redis_defined_command
}

function acquire_semaphore(redis: Redis.Redis, user_id: string, project_id: string, question_id: string, limit: number, timeout: number = redis_config.semaphore_timeout) {
    // @ts-ignore: acquire_semaphore is defined by Lua
    return redis.acquire_semaphore(user_id, project_id, question_id, Date.now(), limit, timeout)
}

function acquire_question_back(redis: Redis.Redis, user_id: string, project_id: string, limit: number) {
    // @ts-ignore: acquire_question_back is defined by Lua
    return redis.acquire_question_back(user_id, project_id, limit, Date.now())
}

function temp_acquire_question(redis: Redis.Redis, user_id: string, project_id: string, question_id: string, timeout: number = redis_config.semaphore_timeout) {
    // @ts-ignore: temp_acquire_question is defined by Lua
    return redis.temp_acquire_question(user_id, project_id, question_id, timeout)
}

exports.raw_connector = raw_connector
exports.connector = connector
exports.acquire_semaphore = acquire_semaphore
exports.acquire_question_back = acquire_question_back
export { raw_connector, connector, temp_acquire_question }
