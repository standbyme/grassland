import * as assert from 'assert'
import * as Redis from 'ioredis'

import * as redis_utils from '../src/redis_utils'

describe('Subscribe', function () {
    this.timeout(10000)
    this.slow(5000)

    const publisher = redis_utils.raw_connector()

    beforeEach(function () {
        publisher.flushall()
    })

    it('should return [project_id, question_id] of overtime question', function (done: () => void) {
        // @ts-ignore: new a function object
        const subscriber = new redis_utils.subscribe({
            config: redis_utils.expired_strategy.config,
            callback: wrap(redis_utils.expired_strategy.callback)
        })

        function wrap(callback: (redis: Redis.Redis, a: string, b: string, message: string) => [string, string]) {
            return function (redis: Redis.Redis, a: string, b: string, message: string) {
                if (callback(redis, a, b, message)[0] === '2') {
                    subscriber.redis_disconnect()
                    done()
                }
            }
        }
        publisher.set('lock/1-2-3-l8fs26f', 0)
        publisher.expire('lock/1-2-3-l8fs26f', 1)

    })
    after(function () {
        publisher.disconnect()
    })
})
