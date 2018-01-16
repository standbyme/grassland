import * as assert from 'assert'
import * as Redis from 'ioredis'

import * as redis_utils from '../src/redis_utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Save Unvalidated Answer', function () {
    this.slow(10000)
    this.timeout(20000)

    const redis = redis_utils.connector()

    beforeEach(function () {
        redis.flushall()
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
        const { question_id } = result.get()
        assert(! await redis.sismember('user/uidxxx/qidxxx', question_id))
    })

    after(function () {
        redis.disconnect()
    })
})
