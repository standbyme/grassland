const fs = require('fs')
const Redis = require('ioredis')
const redis = new Redis(32768, '127.0.0.1')

const config = { acquire_semaphore_lua_script_path: './acquire_semaphore.lua' }

const acquire_semaphore_lua = fs.readFileSync(config.acquire_semaphore_lua_script_path).toString()

redis.defineCommand('acquire_semaphore', {
    numberOfKeys: 0,
    lua: acquire_semaphore_lua
})

async function main() {
    const result = await redis.pipeline()
        .acquire_semaphore('1', '1', '1', Date.now(), '5', '15000')
        .acquire_semaphore('2', '1', '1', Date.now(), '5', '15000')
        .acquire_semaphore('3', '1', '1', Date.now(), '5', '15000')
        .acquire_semaphore('4', '1', '1', Date.now(), '5', '15000')
        .acquire_semaphore('7', '1', '1', Date.now(), '5', '15000')
        .acquire_semaphore('9', '1', '1', Date.now(), '5', '15000')
        .exec();
    console.log(result)
}

main().then(() => {
    redis.disconnect()
})



// redis.pipeline()
//     .echo('5', '1', '1', Date.now(), '3')
//     .echo('6', '1', '1', Date.now(), '3')
//     .echo('7', '1', '1', Date.now(), '3')
//     .echo('8', '1', '1', Date.now(), '3')
//     .exec(function (err, results) {
//         console.log(results)
//     });
