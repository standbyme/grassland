local user_id = ARGV[1]
local project_id = ARGV[2]

local bucket_indics_of_project_key = string.format("project/%s",project_id)

local max_bucket_index = (redis.call('zrevrange',bucket_indics_of_project_key,0,0))[1]

if (max_bucket_index==nil) then
    return nil
end
local function temp_acquire_question()
    <%= temp_acquire_question %>
end


return 7