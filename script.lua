local timeout = 900000

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
    
    return string.format("%s:%s",project_id,question_index)