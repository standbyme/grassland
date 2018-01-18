import * as crypto from 'crypto'
import { Option } from 'funfix-core'
import * as Redis from 'ioredis'
import * as _ from 'lodash'

import { BucketInterface } from './interface'
const redis_config = {
    lock_timeout: 900,
    // 900s is 15min
    capacity_of_bucket: 50,
    required_amount_of_bucket: 20,
    redis: {
        host: '127.0.0.1',
        port: 6379
    }
}
interface Keys {
    [propName: string]: {
        template_str: string,
        lua_str?: string,
        re?: RegExp,
        id_re?: RegExp
    },
}
const redis_key: Keys = {
    question_ids_of_bucket: {
        template_str: 'bucket/<%= project_id %>/<%= bucket_id %>'
    },
    bucket_ids_of_project: {
        template_str: 'project/<%= project_id %>',
        lua_str: 'project/%s'
    },
    user_ids_of_question: {
        template_str: 'question/<%= project_id %>/<%= question_id %>'
    },
    question_ids_of_user: {
        template_str: 'user/<%= user_id %>/<%= project_id %>'
    },
    bucket_ids_of_user: {
        template_str: 'bucket_id/<%= user_id %>/<%= project_id %>',
        lua_str: 'bucket_id/%s/%s'
    },
    lock: {
        template_str: 'lock/<%= user_id %>-<%= project_id %>-<%= question_id %>-<%= lock_secret %>',
        lua_str: 'lock/%s-%s-%s-%s',
        re: /^lock\/(\w+)-(\w+)-(\w+)-(\w+)$/,
        id_re: /^(\w+)-(\w+)-(\w+)-(\w+)$/
    },
    overtime_question_ids_of_project: {
        template_str: 'overtime/<%= project_id %>',
        re: /^overtime\/(\w+)$/
    },
    max_bucket_id_of_project: {
        template_str: 'max_bucket_id/<%= project_id %>'
    },
    content_type_of_answer: {
        template_str: 'content_type/answer/<%= project_id %>'
    }

}

function key_tpl(tpl_name: string) {
    const compiled = _.template(redis_key[tpl_name].template_str)
    return compiled
}
// redis_key.tpl('bucket_ids_of_project')({ project_id: 6 })

function parse_lock_id(lock_id: string) {
    const found = lock_id.match(redis_key.lock.id_re)
    if (found) {
        const [, user_id, project_id, question_id, lock_secret] = found
        return Option.of({ user_id, project_id, question_id, lock_secret })
    } else {
        return Option.none()
    }
}

function define_command(redis: Redis.Redis) {
    const fs = require('fs')
    const util = require('util')

    interface CommandsInterface {
        [propName: string]: string[]
    }

    const commands: CommandsInterface = {
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

                const dependency_command_name_with_file_content = _.merge({}, ...dependency_command_name_with_file_content__list)

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

function acquire_question(redis: Redis.Redis, user_id: string, project_id: string, timeout: number = redis_config.lock_timeout): Promise<Option<{ lock_id: string, question_id: string }>> {
    const secret = Math.random().toString().slice(2, 8)
    const sha1_timestamp = crypto.createHmac('sha256', secret)
        .update(Date.now().toString())
        .digest('hex')
        .slice(0, 6)
    const lock_secret = sha1_timestamp
    // @ts-ignore: acquire_question is defined by Lua
    return redis.acquire_question(user_id, project_id, timeout, lock_secret).then((question_id) => {
        if (question_id == null) {
            return Option.none()
        } else {
            const lock_id = `${user_id}-${project_id}-${question_id}-${lock_secret}`
            return Option.of({ question_id, lock_id })
        }
    })
}

interface SubscribeStrategyInterface {
    config: string,
    event: string,
    callback(regular_mode_redis: Redis.Redis, a: string, b: string, message: string): void
}

const expired_strategy: SubscribeStrategyInterface = {
    config: 'x',
    event: 'expired',
    callback(regular_mode_redis: Redis.Redis, a: string, b: string, message: string): void {
        const found = message.match(redis_key.lock.re)
        if (found) {
            const [, , project_id, question_id] = found
            regular_mode_redis.rpush(key_tpl('overtime_question_ids_of_project')({ project_id }), question_id)
        }
    }
}

function squeeze(list: string[]) {
    const groupBy = _.flow([_.groupBy, _.values])
    const groupBy_result = groupBy(list)
    const only: string[] = Array.from(_.map(groupBy_result, _.head))
    const other: string[] = Array.from(_.flatMap(groupBy_result, _.tail))
    return { only, other }
}

const rpush_strategy: SubscribeStrategyInterface = {
    config: 'l',
    event: 'rpush',
    async callback(regular_mode_redis: Redis.Redis, a: string, b: string, message: string) {
        const found = message.match(redis_key.overtime_question_ids_of_project.re)
        if (found) {
            const [, project_id] = found
            const len = await regular_mode_redis.llen(message)
            if (len > redis_config.capacity_of_bucket) {
                const [[, question_id__list]] = await regular_mode_redis
                    .multi()
                    .lrange(message, 0, redis_config.capacity_of_bucket - 1)
                    .ltrim(message, redis_config.capacity_of_bucket, -1)
                    .exec()
                const { only, other } = squeeze(question_id__list)
                const question_id__set: Set<string> = new Set(only)
                add_bucket(regular_mode_redis, { project_id, question_id__set }).catch(console.log)
                if (!_.isEmpty(other)) {
                    regular_mode_redis.lpush(key_tpl('overtime_question_ids_of_project')({ project_id }), ...other)
                }
            }
        }
    }
}

function subscribe({ config, event, callback }: SubscribeStrategyInterface) {
    const subscriber_mode_redis = new Redis(redis_config.redis.port, redis_config.redis.host)
    const regular_mode_redis = new Redis(redis_config.redis.port, redis_config.redis.host)

    this.redis_disconnect = () => {
        subscriber_mode_redis.disconnect()
        regular_mode_redis.disconnect()
    }

    subscriber_mode_redis.config('set', 'notify-keyspace-events', `${config}E`)
    subscriber_mode_redis.psubscribe(`__keyevent*__:${event}`)
    subscriber_mode_redis.on('pmessage', _.partial(callback, regular_mode_redis))
}

async function add_bucket(redis: Redis.Redis, bucket: BucketInterface) {
    const { project_id, question_id__set } = bucket
    const bucket_id = await redis.incr(key_tpl('max_bucket_id_of_project')({ project_id }))
    const bucket_id_str = bucket_id.toString()
    const promise = redis
        .pipeline()
        .sadd(key_tpl('question_ids_of_bucket')({ project_id, bucket_id }), ...question_id__set)
        .zadd(key_tpl('bucket_ids_of_project')({ project_id }), bucket_id_str, bucket_id_str)
        .exec()
    return promise
}

async function del_info_of_question(redis: Redis.Redis, project_id: string, question_id: string) {
    const user_ids_of_question_key = key_tpl('user_ids_of_question')({ project_id, question_id })
    const user_ids_of_question = await redis.smembers(user_ids_of_question_key)
    const commands = user_ids_of_question.map((user_id: string) => ['srem', key_tpl('question_ids_of_user')({ user_id, project_id }), question_id])
    return Promise.all([redis.pipeline(commands).exec(), redis.del(user_ids_of_question_key)])
}

async function is_needed_to_replenish_question(redis: Redis.Redis, project_id: string, bucket_id: string): Promise<boolean> {
    const rank = await redis.zrevrank(key_tpl('bucket_ids_of_project')({ project_id }), bucket_id)
    if (rank) {
        return (rank < (redis_config.required_amount_of_bucket / 2))
    }
    return false
}

export {
    redis_config, raw_connector, connector, acquire_question,
    subscribe, expired_strategy,
    rpush_strategy, redis_key, key_tpl,
    add_bucket, del_info_of_question, parse_lock_id, is_needed_to_replenish_question
}
