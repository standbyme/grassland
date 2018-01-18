import * as assert from 'assert'
import { Db, MongoClient, ObjectID } from 'mongodb'

import * as db_utils from '../src/db_utils'

describe('Get Question', function () {

    it('basic test', async function () {
        const client = await MongoClient.connect('mongodb://localhost:27017')
        const db = client.db('grassland')
        await db.dropDatabase()
        const col = db.collection('project.pidxxx.question')
        //////
        const { insertedId } = await col.insertOne({ 'title': 'happy' })
        const result_1 = await db_utils.get_question(db, 'pidxxx', '5349b4ddd2781d08c09890f3')
        const result_2 = await db_utils.get_question(db, 'pidxxx', insertedId.toHexString())
        assert(result_1.isEmpty())
        assert.equal(result_2.get().title, 'happy')
        //////
        await client.close()
    })
})
