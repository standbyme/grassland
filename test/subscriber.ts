import * as assert from 'assert'
import * as Redis from 'ioredis'
import * as _ from 'lodash'

import * as redis_utils from '../src/redis_utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Subscribe', function () {
    this.timeout(10000)
    this.slow(5000)

    const publisher = redis_utils.raw_connector()

    beforeEach(function () {
        publisher.flushall()
    })

    it('should push overtime question to overtime list', async function () {
        // @ts-ignore: new a function object
        const subscriber = new redis_utils.subscribe(redis_utils.expired_strategy)

        const result_1 = await publisher.llen('overtime/2')
        await publisher.set('lock/1-2-3-l8fs26f', 0)
        await publisher.expire('lock/1-2-3-l8fs26f', 1)
        await sleep(2)
        const result_2 = await publisher.llen('overtime/2')
        const result_3 = await publisher.lpop('overtime/2')
        const result_4 = await publisher.llen('overtime/2')
        await subscriber.redis_disconnect()
        assert(result_1 === 0)
        assert(result_2 === 1)
        assert(result_3 === '3')
        assert(result_4 === 0)
    })

    it('when a question_id is rpushed to overtime list,it will check the amount of question_id in overtime list', async function () {
        // @ts-ignore: new a function object
        const subscriber = new redis_utils.subscribe(redis_utils.rpush_strategy)
        const project_id = 6
        const key = `overtime/${project_id}`
        const big_array = _.flatMap(_.range(1, 16), m => [m, m, m])
        const small_array = [16, 16, 17, 18, 18, 18, 19, 20, 20]
        // big_array has 45 elements
        // small_array has 9 elements
        await sleep(0.2)
        await publisher.rpush(key, ...big_array)
        await publisher.rpush(key, ...small_array)
        await sleep(1)
        const result_1 = await publisher.scard(`bucket/${project_id}/1`)
        const result_2 = await publisher.llen(key)
        await subscriber.redis_disconnect()
        assert.equal(result_1, 18)
        assert.equal(result_2, 36)
    })

    after(function () {
        publisher.disconnect()
    })
})
