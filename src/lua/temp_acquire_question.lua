local key = string.format("lock/%s",lock_id)
local value = string.format("%s/%s",project_id,question_id)

redis.call('set', key, value)
redis.call('expire', key, timeout)

return true