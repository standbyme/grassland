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

async function main() {
    const result = await redis_utils.acquire_semaphore(redis, '1', '1', '1', '3')

    // redis.pipeline()
    // .acquire_semaphore('1', '1', '1', Date.now(), '5', '15000')
    // .acquire_semaphore('2', '1', '1', Date.now(), '5', '15000')
    // .acquire_semaphore('3', '1', '1', Date.now(), '5', '15000')
    // .acquire_semaphore('4', '1', '1', Date.now(), '5', '15000')
    // .acquire_semaphore('7', '1', '1', Date.now(), '5', '15000')
    // .acquire_semaphore('9', '1', '1', Date.now(), '5', '15000')
    // .exec();
    console.log(result)
}

main().then(() => {
    redis.disconnect()
}).catch((err) => {
    console.log(err)
})