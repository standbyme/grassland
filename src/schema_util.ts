import * as Ajv from 'ajv'
import * as fs from 'fs'
import { Option } from 'funfix-core'
import * as _ from 'lodash'

import { promisify } from 'util'
const exists = promisify(fs.exists)

class JSONSchemaUtil {
    cache: { question: Map<string, Ajv.ValidateFunction>, answer: Map<string, Ajv.ValidateFunction> }
    ajv: Ajv.Ajv

    get_validator_of_answer_content: (content_type_of_answer: string) => Promise<Option<Ajv.ValidateFunction>>
    get_validator_of_question_content: (content_type_of_answer: string) => Promise<Option<Ajv.ValidateFunction>>
    schema_provider: (question_or_answer: string, content_type_of_answer: string) => Promise<Option<Ajv.ValidateFunction>>

    constructor(schema_provider?: (question_or_answer: string, content_type_of_answer: string) => Promise<Option<Ajv.ValidateFunction>>) {
        this.cache = { question: new Map(), answer: new Map() }
        this.ajv = new Ajv()
        this.get_validator_of_answer_content = _.partial(this.get_validator_of_content, 'answer')
        this.get_validator_of_question_content = _.partial(this.get_validator_of_content, 'answer')
        this.schema_provider = schema_provider
    }

    async file_schema_provider(question_or_answer: string, content_type_of_answer: string) {
        const file_path = `schema/${question_or_answer}/${content_type_of_answer}`
        if (await exists(`./src/${file_path}.ts`)) {
            const schema = require(`./${file_path}`)
            const validator = this.ajv.compile(schema)
            return Option.of(validator)
        } else {
            return Option.none()
        }
    }

    async get_validator_of_content(question_or_answer: 'answer' | 'question', content_type_of_answer: string): Promise<Option<Ajv.ValidateFunction>> {
        if (this.cache[question_or_answer].has(content_type_of_answer)) {
            const cache_validator = this.cache[question_or_answer].get(content_type_of_answer)
            return Option.of(cache_validator)
        } else {
            let result
            if (this.schema_provider) result = await this.schema_provider(question_or_answer, content_type_of_answer)
            else result = await this.file_schema_provider(question_or_answer, content_type_of_answer)
            if (result.nonEmpty()) this.cache[question_or_answer].set(content_type_of_answer, result.get())
            return result
        }
    }

    async content_validate(content_type_of_answer: string, content: object) {
        const validator = await this.get_validator_of_answer_content(content_type_of_answer)
        const result = validator.map(func => func(content))
        return result.getOrElse(false)
    }
}

export { JSONSchemaUtil }
