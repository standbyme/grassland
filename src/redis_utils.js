const config = {
    timeout: 900000
}

function acquire_semaphore(redis, user_id, project_id, question_id, limit, timeout = config.timeout) {
    return redis.acquire_semaphore(user_id, project_id, question_id, Date.now(), limit, timeout)
}

exports.acquire_semaphore = acquire_semaphore 