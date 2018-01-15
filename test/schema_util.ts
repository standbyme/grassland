import * as assert from 'assert'
import * as fs from 'fs'
import { Option } from 'funfix-core'
import { promisify } from 'util'

import { JSONSchemaUtil } from '../src/schema_util'

const exists = promisify(fs.exists)

describe('JSON Schema', function () {
    const schema_util = new JSONSchemaUtil('test')

    before(function () {
    })

    it('should return true when schama wrong', async function () {
        const data = {
            'id': 1,
            'name': 'A green door',
            'price': 12.5,
            'tags': ['home', 'green']
        }
        const result = await schema_util.content_validate('stock', data)
        assert(result)
    })

    it('should return false when schama wrong', async function () {
        const data = {
            'id': 1,
            'name': 'A green door',
            'price': '12.5',
            'tags': ['home', 'green']
        }
        const result = await schema_util.content_validate('stock', data)
        assert(!result)
    })
})
