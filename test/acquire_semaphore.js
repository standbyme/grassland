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

async function main() {
    const result_1 = await Promise.all(
        mock_config
            .user_ids
            .slice(0, 3)
            .map((m) => redis_utils.acquire_semaphore(redis, m, '1', '1', 3))
    )
    console.log(result_1)

}

main()
    .then((result) => {
        redis.disconnect()
    })
    .catch((err) => {
        console.log(err)
        redis.disconnect()
    })