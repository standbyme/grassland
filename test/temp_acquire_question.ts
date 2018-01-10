import * as assert from 'assert'

import * as redis_utils from '../src/redis_utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Temp Acquire Question', function () {
    this.slow(16000)
    this.timeout(20000)

    const redis = redis_utils.connector()

    before(function () {
        redis.flushall()
    })

    it('basic test', async function () {
        const mock_config = {
            'user_id': '1',
            'project_id': '2',
            'question_id': '3'
        }
        const key = `${mock_config.user_id}/${mock_config.project_id}/${mock_config.question_id}`
        await redis_utils.temp_acquire_question(redis, mock_config.user_id, mock_config.project_id, mock_config.question_id, 1)
        const result_1 = await redis.get(key)
        await sleep(1)
        const result_2 = await redis.get(key)
        await redis.disconnect()

        assert.equal(result_1, 0)
        assert.equal(result_2, null)
    })
})
