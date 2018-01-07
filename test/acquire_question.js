const assert = require('assert')

describe('Acquire Question', function () {
    this.slow(1000)

    const redis_utils = require('../src/redis_utils.js')
    const redis = redis_utils.raw_connector()

    before(function () {
        redis.flushall()
    })

    it('basic test', async function () {
        const fs = require('fs')



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