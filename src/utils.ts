import { Option } from 'funfix-core'
import * as Redis from 'ioredis'
import * as _ from 'lodash'

interface AnswerInterface {
    lock_id: string,
    content: object
}
/* tslint:disable:no-any*/
function isAnswerInterface(x: any): x is AnswerInterface {
    /* tslint:enable:no-any*/
    if (('lock_id' in x) && ('content' in x)) {
        if ((typeof x.lock_id === 'string') && (typeof x.content === 'object')) {
            return true
        }
    }
    return false
}

async function save_unvalidated_answer(redis: Redis.Redis, answer: object) {
    return isAnswerInterface(answer)
}

export { isAnswerInterface }
