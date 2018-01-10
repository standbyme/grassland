import * as assert from 'assert'

import * as redis_utils from '../src/redis_utils'

describe('Temp Acquire Question', function () {
    this.slow(1000)

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
        const result = await redis_utils.temp_acquire_question(redis, mock_config.user_id, mock_config.project_id, mock_config.question_id, 900)
        await redis.disconnect()

        assert.equal(result, `${mock_config.user_id}/${mock_config.project_id}/${mock_config.question_id}`)
    })
})
