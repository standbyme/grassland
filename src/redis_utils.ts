import * as crypto from 'crypto'
import * as Redis from 'ioredis'
const redis_config = {
    lock_timeout: 900,
    // 900s is 15min
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
        'temp_acquire_question': [],
        'acquire_question': ['temp_acquire_question']
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

function acquire_question(redis: Redis.Redis, user_id: string, project_id: string, timeout: number = redis_config.lock_timeout): Promise<{ lock_secret: string, question_id: string }> {
    const secret = 'grassland'
    const sha1_timestamp = crypto.createHmac('sha256', secret)
        .update(Date.now().toString())
        .digest('hex')
        .slice(0, 6)
    const lock_secret = `${user_id}-${project_id}-${sha1_timestamp}`
    // @ts-ignore: acquire_question is defined by Lua
    return redis.acquire_question(user_id, project_id, timeout, lock_secret).then((question_id) => {
        if (question_id == null) {
            return null
        } else {
            return { lock_secret, question_id }
        }
    })
}

function temp_acquire_question(redis: Redis.Redis, user_id: string, project_id: string, question_id: string, timeout: number = redis_config.lock_timeout, lock_secret: string) {
    // @ts-ignore: temp_acquire_question is defined by Lua
    return redis.temp_acquire_question(user_id, project_id, question_id, timeout, lock_secret)
}

export { raw_connector, connector, acquire_question, temp_acquire_question }
