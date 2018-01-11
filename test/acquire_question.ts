import * as assert from 'assert'

import * as redis_utils from '../src/redis_utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Acquire Question', function () {
    this.slow(16000)
    this.timeout(20000)

    const redis = redis_utils.connector()

    beforeEach(function () {
        redis.flushall()
    })

    it('should return null if there is not any project named given project_id', async function () {
        const mock_config = {
            'user_id': '6',
            'empty_project_id': '4',
            'project_id': '2'
        }
        await redis.zadd(`project/${mock_config.project_id}`, '4', '4', '7', '7', '16', '16', '32', '32')
        const result = await redis_utils.acquire_question(redis, mock_config.user_id, mock_config.empty_project_id)

        assert.equal(result, null)
    })

    after(async function () {
        await redis.disconnect()
    })
})
