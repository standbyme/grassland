import * as assert from 'assert'
import * as Redis from 'ioredis'

import * as redis_utils from '../src/redis_utils'
import { JSONSchemaUtil } from '../src/schema_util'
import * as utils from '../src/utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Save Unvalidated Answer', function () {
    this.slow(10000)
    this.timeout(20000)

    const redis = redis_utils.connector()
    const schema_util = new JSONSchemaUtil('test')

    beforeEach(function () {
        redis.flushall()
    })

    it('isAnswerInterface test', function () {
        const wrong = {
            lock_id: '123',
            content: '6'
        }
        const right = {
            lock_id: '123',
            content: { title: 'happy' }
        }
        assert(!utils.isAnswerInterface(wrong))
        assert(utils.isAnswerInterface(right))
    })

    it('basic test', async function () {
        const project_id = 'pidxxx'
        const question_ids = ['qidxx9,qidxx1', 'qidxx4', 'qidxx0']
        const bucket = {
            project_id,
            question_id__set: new Set(question_ids)
        }
        await redis.set('content_type/answer/pidxxx', 'TestSchema')
        await redis.set('bucket_id/uidxxx/pidxxx', 0)
        await redis_utils.add_bucket(redis, bucket)
        const result = await redis_utils.acquire_question(redis, 'uidxxx', 'pidxxx')
        assert(result.nonEmpty())
        const { question_id, lock_id } = result.get()
        assert(! await redis.sismember('user/uidxxx/qidxxx', question_id))
        assert(
            (await utils.save_unvalidated_answer(redis, schema_util, {}))
                .fold(
                error => `${error}`,
                success => null
                ) === 'format is wrong'
        )
        assert.equal(
            (await utils.save_unvalidated_answer(redis, schema_util, { lock_id: 'faked', content: {} }))
                .fold(
                error => `${error}`,
                success => null
                ), 'lock_id not found'
        )
        assert.equal(
            (await utils.save_unvalidated_answer(redis, schema_util, { lock_id, content: { 'wrong_schema': 6 } }))
                .fold(
                error => `${error}`,
                success => null
                ), 'content schema is wrong'
        )
        const lock_key = `lock/${lock_id}`
        assert(await (redis.exists(lock_key)))
        assert(
            (await utils.save_unvalidated_answer(redis, schema_util, { lock_id, content: { 'material': 'ok', 'field': 'yes' } }))
                .isSuccess()
        )
        assert((await redis.sismember('user/uidxxx/pidxxx', question_id)))
        assert(!(await redis.exists(lock_key)))
    })

    after(function () {
        redis.disconnect()
    })
})
