import { Failure, Option, Success, Try } from 'funfix-core'
import * as Redis from 'ioredis'
import * as _ from 'lodash'

import * as redis_utils from '../src/redis_utils'
import { JSONSchemaUtil } from '../src/schema_util'

interface AnswerInterface {
    lock_id: string,
    content: object
}
/* tslint:disable:no-any*/
function isAnswerInterface(x: any): x is AnswerInterface {
    /* tslint:enable:no-any*/
    if (('lock_id' in x) && ('content' in x)) {
        if ((typeof x.lock_id === 'string') && (typeof x.content === 'object')) {
            return true
        }
    }
    return false
}

async function save_unvalidated_answer(redis: Redis.Redis, schema_util: JSONSchemaUtil, answer: object): Promise<Try<string>> {
    if (!isAnswerInterface(answer)) return Failure('format is wrong')
    const { lock_id, content } = answer
    const lock_key = `lock/${lock_id}`
    if (!(await redis.exists(lock_key))) return Failure('lock_id not found')
    const lock_info = redis_utils.parse_lock_id(lock_id)
    if (lock_info.isEmpty()) return Failure('lock_id is wrong')
    const { user_id, project_id, question_id } = lock_info.get()
    const content_type_of_answer = await redis.get(redis_utils.key_tpl('content_type_of_answer')({ project_id }))
    if (!(await schema_util.content_validate(content_type_of_answer, content))) return Failure('content schema is wrong')
    await redis.pipeline()
        .del(lock_key)
        .sadd(redis_utils.key_tpl('question_ids_of_user')({ user_id, project_id }), question_id)
        .exec()
    return Success('OK')
}

export { isAnswerInterface, save_unvalidated_answer }
