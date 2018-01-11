local user_id = ARGV[1]
local project_id = ARGV[2]

local bucket_indics_of_project_key = string.format("project/%s",project_id)
local bucket_indix_of_user_project_key = string.format("bucket_index/%s/%s",user_id,project_id)

local max_bucket_index = (redis.call('zrevrange',bucket_indics_of_project_key,0,0))[1]

if (max_bucket_index==nil) then
    return nil
end

local init_bucket_index = redis.call('get',bucket_indix_of_user_project_key)

local function acquire_question_of_specific_bucket(bucket_index)
    if (bucket_index>max_bucket_index) then
        return nil
    end
end

local function temp_acquire_question()
    <%= temp_acquire_question %>
end


return acquire_question_of_specific_bucket(init_bucket_index)