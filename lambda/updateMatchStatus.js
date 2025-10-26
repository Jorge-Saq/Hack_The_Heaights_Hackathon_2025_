const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));
        
        // Get user ID from the request context
        const userId = event.requestContext.authorizer.claims.sub;
        
        if (!userId) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Unauthorized - no user ID found'
                })
            };
        }
        
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { match_id, status } = body;
        
        if (!match_id || !status) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Missing required parameters: match_id, status'
                })
            };
        }
        
        // Validate status value
        const validStatuses = ['accepted', 'declined', 'pending'];
        if (!validStatuses.includes(status)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Invalid status. Must be one of: accepted, declined, pending'
                })
            };
        }
        
        // First, verify that the match belongs to this user
        const getParams = {
            TableName: process.env.MATCHED_PHOTOS_TABLE,
            Key: { match_id }
        };
        
        const matchRecord = await dynamodb.get(getParams).promise();
        
        if (!matchRecord.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Match not found'
                })
            };
        }
        
        if (matchRecord.Item.cognito_user_id !== userId) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Forbidden - match does not belong to this user'
                })
            };
        }
        
        // Update the match status
        const updateParams = {
            TableName: process.env.MATCHED_PHOTOS_TABLE,
            Key: { match_id },
            UpdateExpression: 'SET #status = :status, updated_at = :updated_at',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':updated_at': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await dynamodb.update(updateParams).promise();
        
        console.log(`Updated match ${match_id} status to ${status} for user ${userId}`);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Match status updated successfully',
                match_id,
                status,
                updated_at: result.Attributes.updated_at
            })
        };
        
    } catch (error) {
        console.error('Error updating match status:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
