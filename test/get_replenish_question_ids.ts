import * as assert from 'assert'
import { Db, MongoClient, ObjectID } from 'mongodb'

import * as db_utils from '../src/db_utils'

describe('Get Replenish Questions ids', function () {

    it('basic test', async function () {
        const client = await MongoClient.connect('mongodb://localhost:27017')
        const db = client.db('grassland')
        await db.dropDatabase()
        const col = db.collection('project.pidxxx.question')
        //////
        await col.insertOne({ 'name': 111, 'is_in_bucket': true })
        await col.insertOne({ 'name': 222, 'is_in_bucket': false })
        await col.insertOne({ 'name': 333, 'is_in_bucket': true })
        await col.insertOne({ 'name': 444, 'is_in_bucket': false })
        await col.insertOne({ 'name': 555, 'is_in_bucket': false })
        const result_1 = await db_utils.get_replenish_question_ids(db, 'pidxxx', 2)
        const result_2 = await db_utils.get_replenish_question_ids(db, 'pidxxx', 3)
        const result_3 = await db_utils.get_replenish_question_ids(db, 'pidxxx', 4)
        assert(result_1.size === 2)
        assert.equal(result_2.size, 3)
        assert.equal(result_3.size, 3)
        //////
        await client.close()
    })
})
