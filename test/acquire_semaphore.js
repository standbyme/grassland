const Redis = require('ioredis')
const redis = new Redis(32768, '127.0.0.1')

const fs = require('fs')

const redis_utils = require('../src/redis_utils.js')

const config = {
    acquire_semaphore_lua_script_path: '../src/lua/acquire_semaphore.lua',
}

const acquire_semaphore_lua = fs.readFileSync(config.acquire_semaphore_lua_script_path).toString()

redis.defineCommand('acquire_semaphore', {
    numberOfKeys: 0,
    lua: acquire_semaphore_lua
})

const mock_config = {
    user_ids: [
        '5a51ebd0e85539e9b2633e00',
        '5a51ebd0e85539e9b2633e01',
        '5a51ebd0e85539e9b2633e02',
        '5a51ebd0e85539e9b2633e03',
        '5a51ebd0e85539e9b2633e04',
        '5a51ebd0e85539e9b2633e05'
    ]
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    const result_1 = await Promise.all(
        mock_config
            .user_ids
            .slice(0, 3)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )
    const result_2 = await Promise.all(
        mock_config
            .user_ids
            .slice(3, 5)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )
    const result_3 = await Promise.all(
        mock_config
            .user_ids
            .slice(0, 3)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )

    await sleep(16000)

    const result_4 = await Promise.all(
        mock_config
            .user_ids
            .slice(3, 6)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )

    const result_5 = await Promise.all(
        mock_config
            .user_ids
            .slice(0, 3)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )

    await sleep(16000)

    const result_6 = await Promise.all(
        mock_config
            .user_ids
            .slice(2, 5)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )

    const result_7 = await Promise.all(
        mock_config
            .user_ids
            .slice(0, 1)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )
    console.log(result_1)
    console.log(result_2)
    console.log(result_3)
    console.log(result_4)
    console.log(result_5)
    console.log(result_6)
    console.log(result_7)

}

main()
    .then((result) => {
        redis.disconnect()
    })
    .catch((err) => {
        console.log(err)
        redis.disconnect()
    })