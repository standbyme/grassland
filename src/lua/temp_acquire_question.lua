local user_id = ARGV[1]
local project_id = ARGV[2]
local question_id = ARGV[3]

local key = string.format("%s/%s/%s",user_id,project_id,question_id)

redis.call('set', key, 0)
redis.call('expire', key, 5)

return true