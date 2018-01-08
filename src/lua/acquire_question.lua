local user_id = ARGV[1]
local project_id = ARGV[2]
local limit = ARGV[3]
local now = tonumber(ARGV[4])

local project_name = string.format("project/%s",project_id)

local function acquire_semaphore()
    <%= acquire_semaphore %>
end

local function acquire_specific_rank_question(rank)
    -- rank is ordered by lock number desc
    local question_id = (redis.call('zrevrange',project_name,rank,rank))[1]
    if(question_id==nil)
    then
        return nil
    else
        local record_name = string.format("record/%s/%s",project_id,question_id)
        -- record is the finished user list of question
        if(redis.call('sismember',record_name,user_id)==1)
        -- if user exists in record(the user has finished this question)
        then
            return acquire_specific_rank_question(rank+1)
        else
            return question_id
        end
    end
end

return acquire_specific_rank_question(0)