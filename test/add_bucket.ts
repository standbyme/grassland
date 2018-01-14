import * as assert from 'assert'
import * as Redis from 'ioredis'

import * as redis_utils from '../src/redis_utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Add Bucket', function () {
    this.slow(10000)
    this.timeout(20000)

    const redis = redis_utils.connector()

    before(function () {
        redis.flushall()
    })

    it('basic test', async function () {
        const project_id = '6'
        const question_id__set = new Set(['1', '5', '9'])
        const bucket = { project_id, question_id__set }
        const result_1 = await redis.get(`max_bucket_id/${project_id}`)
        const result_2 = await redis.scard(`bucket/${project_id}/1`)
        await redis_utils.add_bucket(redis, bucket)
        const result_3 = await redis.get(`max_bucket_id/${project_id}`)
        const result_4 = await redis.scard(`bucket/${project_id}/1`)
        await redis.disconnect()
        assert(!result_1)
        assert(result_2 === 0)
        assert(result_3 === '1')
        assert.equal(result_4, 3)
        // lack equal equal one by one
    })
})
