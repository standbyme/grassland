import { Db, MongoClient, ObjectID } from 'mongodb'

import { redis_config } from './redis_utils'
async function get_required_amount_of_replenish_of_sample(db: Db, project_id: string): Promise<number> {
    const project_object_id = ObjectID.createFromHexString(project_id)
    const col = db.collection('project')
    const { required_amount_of_sample } = await col.findOne({ _id: project_object_id })
    const { required_amount_of_bucket, capacity_of_bucket } = redis_config
    const amount_of_question = Math.floor((capacity_of_bucket * required_amount_of_bucket) / required_amount_of_sample)
    return amount_of_question
}

export { get_required_amount_of_replenish_of_sample }
