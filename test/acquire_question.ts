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
        const result = await redis_utils.acquire_question(redis, mock_config.user_id, mock_config.empty_project_id)

        assert(result.isEmpty())
    })

    it('should return null if there is not any bucket in project', async function () {
        const mock_config = {
            'user_id': '6',
            'project_id': '2'
        }
        await redis.set(`bucket_index/${mock_config.user_id}/${mock_config.project_id}`, 100)
        await redis.zadd(`project/${mock_config.project_id}`, '4', '4', '7', '7', '16', '16', '32', '32')
        const result = await redis_utils.acquire_question(redis, mock_config.user_id, mock_config.project_id)

        assert(result.isEmpty())
    })

    it('basic test', async function () {
        const mock_config = {
            'user_id': '6',
            'project_id': '2'
        }
        await redis.set(`bucket_index/${mock_config.user_id}/${mock_config.project_id}`, 8)
        await redis.zadd(`project/${mock_config.project_id}`, '4', '4', '7', '7', '16', '16', '32', '32')
        await redis.sadd(`bucket/${mock_config.project_id}/4`, 4, 5, 7)
        await redis.sadd(`bucket/${mock_config.project_id}/7`, 4, 5, 7, 11)
        await redis.sadd(`bucket/${mock_config.project_id}/16`, 4, 5, 6, 9, 12)
        await redis.sadd(`bucket/${mock_config.project_id}/32`, 3, 6)
        await redis.sadd(`user/${mock_config.user_id}/${mock_config.project_id}`, 4, 12)

        const result = await redis_utils.acquire_question(redis, mock_config.user_id, mock_config.project_id, 1)

        assert.equal(result.get().question_id, '5')
    })

    after(async function () {
        await redis.disconnect()
    })
})
