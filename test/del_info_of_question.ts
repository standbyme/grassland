import * as assert from 'assert'
import * as Redis from 'ioredis'
import * as _ from 'lodash'

import * as redis_utils from '../src/redis_utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Del Info Of Question', function () {
    this.slow(16000)
    this.timeout(20000)

    const redis = redis_utils.connector()

    beforeEach(function () {
        redis.flushall()
    })

    it('basic test', async function () {
        await redis.sadd('question/6/12', 1, 2, 4)
        await Promise.all([redis.sadd('user/1/6', 12, 15), redis.sadd('user/2/6', 12, 16, 3, 4), redis.sadd('user/4/6', 12, 1, 3)])
        await redis_utils.del_info_of_question(redis, '6', '12')
        const result = await Promise.all([redis.smembers('user/1/6'), redis.smembers('user/2/6'), redis.smembers('user/4/6')])
        assert(_.isEqual(result, [['15'], ['3', '4', '16'], ['1', '3']]))
    })

    after(function () {
        redis.disconnect()
    })

})
