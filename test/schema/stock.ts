module.exports = {
    'title': 'Product',
    'description': 'A product from Acme\'s catalog',
    'type': 'object',
    'properties': {
        'id': {
            'description': 'The unique identifier for a product',
            'type': 'integer'
        },
        'name': {
            'description': 'Name of the product',
            'type': 'string'
        },
        'price': {
            'type': 'number',
            'exclusiveMinimum': 0
        },
        'tags': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'minItems': 1,
            'uniqueItems': true
        }
    },
    'required': ['id', 'name', 'price']
}
