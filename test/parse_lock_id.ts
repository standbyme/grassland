import * as assert from 'assert'

import * as redis_utils from '../src/redis_utils'

describe('Parse Lock ID', function () {

    it('should return None when the format is wrong', function () {
        const lock_id = 'uidxxx*pidxxx-qidxxx-secretxxx'
        assert(redis_utils.parse_lock_id(lock_id).isEmpty())
    })

    it('should return Some when the format is right', function () {
        const lock_id = 'uidxxx-pidxxx-qidxxx-secretxxx'
        const result = redis_utils.parse_lock_id(lock_id)
        assert(result.nonEmpty())
        const { user_id, project_id, question_id, lock_secret } = result.get()
        assert.equal(user_id, 'uidxxx')
        assert.equal(project_id, 'pidxxx')
        assert.equal(question_id, 'qidxxx')
        assert.equal(lock_secret, 'secretxxx')
    })
})
