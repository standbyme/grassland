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