import { Db, MongoClient, ObjectID } from 'mongodb'

async function get_required_amount_of_replenish_of_sample(db: Db, project_id: string): Promise<number> {
    const project_object_id = ObjectID.createFromHexString(project_id)
    const col = db.collection('project')
    const result = await col.findOne({ _id: project_object_id })
    console.log(result)
    return 1
}

export { get_required_amount_of_replenish_of_sample }
