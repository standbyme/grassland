import * as assert from 'assert'

describe('Acquire Question', function () {
    this.slow(1000)

    const redis_utils = require('../src/redis_utils')
    const redis = redis_utils.connector()

    before(function () {
        redis.flushall()
    })

    it('basic test', async function () {
        const mock_config = {
            'project_id': '5a51ebd0e85539e9b2633e00',
            'question_id__list': [
                '5a51ebd0e85539e9b2633e01',
                '5a51ebd0e85539e9b2633e02',
                '5a51ebd0e85539e9b2633e03'
            ]
        }

        await redis.zadd(`project/${mock_config.project_id}`, 6, mock_config.question_id__list[0], 3, mock_config.question_id__list[1], 1, mock_config.question_id__list[2])
        const result_1 = await redis_utils.acquire_question(redis, 2, mock_config.project_id, 4)
        // result_1 maybe null !!

        await redis.disconnect()

        assert.equal(result_1, mock_config.question_id__list[0])
    })
})
