local user_id = ARGV[1]
local project_id = ARGV[2]
local limit = ARGV[3]

local project_name = string.format("project/%s",project_id)

local function acquire_specific_rank_question(rank)
    -- rank is ordered by lock number desc
    local question_id = (redis.call('zrevrange',project_name,rank,rank))[1]
    return 1
end

return 5