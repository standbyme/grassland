const assert = require('assert')

describe('Acquire Question', function () {
    this.slow(1000)

    it('basic test', async function () {
        const fs = require('fs')

        const redis_utils = require('../src/redis_utils.js')
        const redis = redis_utils.raw_connector()

        const config = {
            // acquire_semaphore_lua_script_patch_path: './test/lua_patch/acquire_semaphore.patch.lua',
            acquire_question_lua_script_path: './src/lua/acquire_question.lua'
        }

        //patch is only used in test 
        // const acquire_semaphore_lua_script_patch = fs.readFileSync(config.acquire_semaphore_lua_script_patch_path).toString()
        const acquire_question_lua_script_main = fs.readFileSync(config.acquire_question_lua_script_path).toString()
        const acquire_question_lua_script = acquire_question_lua_script_main

        redis.defineCommand('acquire_question', {
            numberOfKeys: 0,
            lua: acquire_question_lua_script
        })

        const mock_config = {
            timeout: 100
        }

        const result_1 = await redis_utils.acquire_question(redis, 2, 3, 4)

        await redis.disconnect()

        assert.equal(result_1, 5)
    })
})