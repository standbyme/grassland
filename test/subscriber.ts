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

    it('should push overtime question to overtime list', async function () {
        // @ts-ignore: new a function object
        const subscriber = new redis_utils.subscribe({
            config: redis_utils.expired_strategy.config,
            callback: redis_utils.expired_strategy.callback
        })

        const result_1 = await publisher.llen('overtime/2')
        await publisher.set('lock/1-2-3-l8fs26f', 0)
        await publisher.expire('lock/1-2-3-l8fs26f', 1)
        await sleep(2)
        const result_2 = await publisher.llen('overtime/2')
        const result_3 = await publisher.lpop('overtime/2')
        await subscriber.redis_disconnect()
        assert(result_1 === 0)
        assert(result_2 === 1)
        assert(result_3 === '3')
    })
    after(function () {
        publisher.disconnect()
    })
})
