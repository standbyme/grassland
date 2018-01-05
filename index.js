const Redis = require('ioredis')
const redis = new Redis(32768, '127.0.0.1')

const lua =
    `
    local timeout = 15000

    local user_id = ARGV[1]
    local project_id = ARGV[2]
    local question_index = ARGV[3]
    local now = ARGV[4]
    local limit = ARGV[5]
    
    local semname = string.format("%s:%s",project_id,question_index)
    
    redis.call('zadd',semname,now,user_id)
    redis.call('zremrangebyscore',semname,'-inf',now-timeout)
    
    if(redis.call('zcard',semname)<=tonumber(limit))
    then
        return true
    else
        redis.call('zrem',semname,user_id)
        return false
    end
    `

redis.defineCommand('echo', {
    numberOfKeys: 0,
    lua
});

async function main() {
    const result = await redis.pipeline()
        .echo('1', '1', '1', Date.now(), '3')
        .echo('2', '1', '1', Date.now(), '3')
        .echo('3', '1', '1', Date.now(), '3')
        .echo('4', '1', '1', Date.now(), '3')
        .exec();
    console.log(result)
}

main().then(()=>{
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
