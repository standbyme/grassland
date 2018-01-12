import * as assert from 'assert'

import * as redis_utils from '../src/redis_utils'

function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}

describe('Temp Acquire Question', function () {
    this.slow(16000)
    this.timeout(20000)

    const redis = redis_utils.raw_connector()

    before(function () {
        redis.flushall()
    })

    it('basic test', async function () {
        const fs = require('fs')

        const config = {
            temp_acquire_question_lua_script_patch_path: './test/lua_patch/temp_acquire_question.patch.lua',
            temp_acquire_question_lua_script_path: './src/lua/temp_acquire_question.lua'
        }

        // patch is only used in test
        const temp_acquire_question_lua_script_patch = fs.readFileSync(config.temp_acquire_question_lua_script_patch_path).toString()
        const temp_acquire_question_lua_script_main = fs.readFileSync(config.temp_acquire_question_lua_script_path).toString()
        const temp_acquire_question_lua_script = temp_acquire_question_lua_script_patch + temp_acquire_question_lua_script_main

        redis.defineCommand('temp_acquire_question', {
            numberOfKeys: 0,
            lua: temp_acquire_question_lua_script
        })
        const mock_config = {
            'user_id': '1',
            'project_id': '2',
            'question_id': '3',
            'lock_secret': '6-e0eff6'
        }
        const key = `lock/${mock_config.lock_secret}`
        await redis_utils.temp_acquire_question(redis, mock_config.user_id, mock_config.project_id, mock_config.question_id, 1, mock_config.lock_secret)
        const result_1 = await redis.get(key)
        await sleep(1)
        const result_2 = await redis.get(key)
        await redis.disconnect()

        assert.equal(result_1, `${mock_config.project_id}/${mock_config.question_id}`)
        assert.equal(result_2, null)
    })
})
