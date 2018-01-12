local key = string.format("lock/%s-%s-%s-%s",user_id,project_id,question_id,lock_secret)
local value = ''

redis.call('set', key, value)
redis.call('expire', key, timeout)

return true