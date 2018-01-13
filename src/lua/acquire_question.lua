local user_id = ARGV[1]
local project_id = ARGV[2]
local timeout = tonumber(ARGV[3])
local lock_secret = ARGV[4]

local bucket_ids_of_project_key = string.format("project/%s",project_id)
local bucket_id_of_user_project_key = string.format("bucket_id/%s/%s",user_id,project_id)

local max_bucket_id = tonumber((redis.call('zrevrange',bucket_ids_of_project_key,0,0))[1])

if (max_bucket_id==nil) then
    return nil
end

local init_bucket_id = tonumber(redis.call('get',bucket_id_of_user_project_key))

local function temp_acquire_question(question_id)
    <%= temp_acquire_question %>
end

local function acquire_question_of_specific_bucket(bucket_id)
    if (bucket_id>max_bucket_id) then
        return nil
    end

    if(redis.call('zscore',bucket_ids_of_project_key,bucket_id)==false) then
        return acquire_question_of_specific_bucket(bucket_id+1)
    end

    local indics_of_bucket_key = string.format("bucket/%s/%s",project_id,bucket_id)
    local indics_of_question_user_has_finished_key = string.format("user/%s/%s",user_id,project_id)
    local new_questions = redis.call('sdiff',indics_of_bucket_key,indics_of_question_user_has_finished_key)

    for k, v in pairs(new_questions) do
        local result = redis.call('srem',indics_of_bucket_key,v)
        if (result==1) then
            temp_acquire_question(v)
            return v
        end
    end

    return acquire_question_of_specific_bucket(bucket_id+1)
end




return acquire_question_of_specific_bucket(init_bucket_id)