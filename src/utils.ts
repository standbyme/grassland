import { Failure, Option, Success, Try } from 'funfix-core'
import * as Redis from 'ioredis'
import * as _ from 'lodash'
import { Db } from 'mongodb'

import * as db_utils from '../src/db_utils'
import * as redis_utils from '../src/redis_utils'
import { JSONSchemaUtil } from '../src/schema_util'

import { AnswerInterface, BucketInterface } from './interface'
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

async function save_validated_answer(user_id: string, project_id: string, question_id: string, content: object) {

}
function make_bucket(project_id: string, question_id__set: Set<string>): BucketInterface {
    return { project_id, question_id__set }
}
function make_buckets(project_id: string, question_id__set: Set<string>): BucketInterface[] {
    const question_id__list = [...question_id__set]
    const result = _.chunk(question_id__list, redis_utils.redis_config.capacity_of_bucket)
        .map((m: string[]) => new Set(m))
        .map((m: Set<string>) => make_bucket(project_id, question_id__set))
    return result
}

async function check_and_replenish_question(redis: Redis.Redis, db: Db, project_id: string, bucket_id: string) {
    if (await redis_utils.is_needed_to_replenish_question(redis, project_id, bucket_id)) {
        const amount_of_replenish_question = await db_utils.get_required_amount_of_replenish_question(db, project_id)
        const replenish_question_id__set = await db_utils.get_replenish_question_ids(db, project_id, amount_of_replenish_question)
        const buckets = make_buckets(project_id, replenish_question_id__set)
        await Promise.all(buckets.map(bucket => redis_utils.add_bucket(redis, bucket)))
    }
}
export { isAnswerInterface, save_unvalidated_answer, check_and_replenish_question }
