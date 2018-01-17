interface AnswerInterface {
    lock_id: string,
    content: object
}

interface BucketInterface {
    project_id: string,
    question_id__set: Set<string>
}

export { AnswerInterface, BucketInterface }
