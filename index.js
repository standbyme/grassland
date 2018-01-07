const Redis = require('ioredis')
const redis = new Redis(32768, '127.0.0.1')

const acquire_semaphore_lua =
    `
    local user_id = ARGV[1]
    local project_id = ARGV[2]
    local question_id = ARGV[3]
    local now = tonumber(ARGV[4])
    local limit = tonumber(ARGV[5])
    local timeout = tonumber(ARGV[6])

    local semphore_name = string.format("semphore/%s/%s",project_id,question_id)
    local record_name = string.format("record/%s/%s",project_id,question_id)

    redis.call('zadd',semphore_name,now,user_id)
    redis.call('zremrangebyscore',semphore_name,'-inf',now-timeout)

    if((redis.call('zcard',semphore_name)+redis.call('zcard',record_name))<=limit)
    then
        return true
    else
        redis.call('zrem',semphore_name,user_id)
        return false
    end
    `

redis.defineCommand('acquire_semaphore', {
    numberOfKeys: 0,
    lua: acquire_semaphore_lua
});

async function main() {
    const result = await redis.pipeline()
        .acquire_semaphore('1', '1', '1', Date.now(), '5','15000')
        .acquire_semaphore('2', '1', '1', Date.now(), '5','15000')
        .acquire_semaphore('3', '1', '1', Date.now(), '5','15000')
        .acquire_semaphore('4', '1', '1', Date.now(), '5','15000')
        .acquire_semaphore('7', '1', '1', Date.now(), '5','15000')
        .acquire_semaphore('9', '1', '1', Date.now(), '5','15000')
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
