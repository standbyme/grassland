const config = {
    timeout: 15000
}

function acquire_semaphore(redis, user_id, project_id, question_id, limit) {
    return redis.acquire_semaphore(user_id, project_id, question_id, Date.now(), limit, config.timeout)
}

exports.acquire_semaphore = acquire_semaphore 