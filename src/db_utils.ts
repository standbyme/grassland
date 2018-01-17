import { Db, MongoClient, ObjectID } from 'mongodb'

import { redis_config } from './redis_utils'
async function get_required_amount_of_replenish_question(db: Db, project_id: string): Promise<number> {
    const project_object_id = ObjectID.createFromHexString(project_id)
    const col = db.collection('project')
    const { required_amount_of_sample } = await col.findOne({ _id: project_object_id })
    const { required_amount_of_bucket, capacity_of_bucket } = redis_config
    const amount_of_question = Math.floor((capacity_of_bucket * required_amount_of_bucket) / required_amount_of_sample)
    return amount_of_question
}

async function get_replenish_question_ids(db: Db, project_id: string, amount_of_replenish_question: number): Promise<Set<string>> {
    const col = db.collection(`project.${project_id}.question`)
    const question_ids = (await col.find({ 'is_in_bucket': false }).limit(amount_of_replenish_question).toArray()).map((m: { _id: ObjectID }) => m._id.toHexString())
    return new Set(question_ids)
}

export { get_required_amount_of_replenish_question, get_replenish_question_ids }
