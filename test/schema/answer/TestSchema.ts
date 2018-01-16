module.exports = {
    'type': 'object',
    'properties': {
        'material': {
            'description': 'The unique identifier for a product',
            'type': 'string'
        },
        'field': {
            'description': 'Name of the product',
            'type': 'string'
        }
    },
    'required': ['material', 'field']
}
