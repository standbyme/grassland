import * as assert from 'assert'
import * as Redis from 'ioredis'

import * as redis_utils from '../src/redis_utils'

describe('Is Needed to Replenish Question', function () {

    const redis = redis_utils.connector()

    beforeEach(function () {
        redis.flushall()
    })

    it('should return false if the bucket does not exist', async function () {
        await redis.zadd('project/pidxxx', '2', '2', '4', '4', '5', '5')
        const result = await redis_utils.is_needed_to_replenish_question(redis, 'pidxxx', '3')
        assert(!result)
    })

    it('should return true if it is needed to replenish question', async function () {
        await redis.zadd('project/pidxxx', '2', '2', '4', '4', '5', '5')
        const result = await redis_utils.is_needed_to_replenish_question(redis, 'pidxxx', '4')
        assert(result)
    })

    it('should return false if it is not need to replenish question', async function () {
        for (let i = 1; i <= 20; i++) {
            await redis.zadd('project/pidxxx', i.toString(), i.toString())
        }
        const result_1 = await redis_utils.is_needed_to_replenish_question(redis, 'pidxxx', '9')
        const result_2 = await redis_utils.is_needed_to_replenish_question(redis, 'pidxxx', '11')

        assert(!result_1)
        assert(result_2)

    })

    after(function () {
        redis.disconnect()
    })
})
