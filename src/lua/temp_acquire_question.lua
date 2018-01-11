local key = string.format("lock/%s/%s/%s",user_id,project_id,question_id)

redis.call('set', key, 0)
redis.call('expire', key, timeout)

return true