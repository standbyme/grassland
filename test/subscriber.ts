import * as assert from 'assert'
import * as Redis from 'ioredis'

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

    it('should return [project_id, question_id] of overtime question', async function () {
        // @ts-ignore: new a function object
        const subscriber = new redis_utils.subscribe({
            config: redis_utils.expired_strategy.config,
            callback: redis_utils.expired_strategy.callback
        })

        // function wrap(callback: (redis: Redis.Redis, a: string, b: string, message: string) => [string, string]) {
        //     return function (redis: Redis.Redis, a: string, b: string, message: string) {
        //         if (callback(redis, a, b, message)[0] === '2') {
        //             subscriber.redis_disconnect()
        //             done()
        //         }
        //     }
        // }
        const result_1 = await publisher.llen('overtime/2')
        await publisher.set('lock/1-2-3-l8fs26f', 0)
        await publisher.expire('lock/1-2-3-l8fs26f', 1)
        await sleep(2)
        const result_2 = await publisher.llen('overtime/2')
        await subscriber.redis_disconnect()
        assert.equal(result_1, 0)
        assert.equal(result_2, 1)
    })
    after(function () {
        publisher.disconnect()
    })
})
