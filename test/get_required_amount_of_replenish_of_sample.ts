import * as assert from 'assert'
import { Db, MongoClient, ObjectID } from 'mongodb'

import * as db_utils from '../src/db_utils'

describe('Get Required Amount of Replenish Of Sample', function () {

    it('basic test', async function () {
        const client = await MongoClient.connect('mongodb://localhost:27017')
        const db = client.db('grassland')
        await db.dropDatabase()
        const col = db.collection('project')
        //////
        const { insertedId } = await col.insertOne({ 'required_amount_of_sample': 3 })
        assert.equal((await db_utils.get_required_amount_of_replenish_question(db, insertedId.toHexString())), 333)

        //////
        await client.close()
    })
})
