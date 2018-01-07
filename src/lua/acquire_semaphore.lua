local user_id = ARGV[1]
local project_id = ARGV[2]
local question_id = ARGV[3]
local now = tonumber(ARGV[4])
local limit = tonumber(ARGV[5])
local timeout = tonumber(ARGV[6])

local semaphore_name = string.format("semaphore/%s/%s",project_id,question_id)
local record_name = string.format("record/%s/%s",project_id,question_id)

redis.call('zadd',semaphore_name,now,user_id)
redis.call('zremrangebyscore',semaphore_name,'-inf',now-timeout)

if((redis.call('zcard',semaphore_name)+redis.call('zcard',record_name))<=limit)
then
    return true
else
    redis.call('zrem',semaphore_name,user_id)
    return false
end