const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();

exports.handler = async (event) => {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));
        
        // Parse the request body
        const body = JSON.parse(event.body || '{}');
        const { bucket, key, contentType, userId } = body;
        
        // Validate required parameters
        if (!bucket || !key || !contentType) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Missing required parameters: bucket, key, contentType'
                })
            };
        }
        
        // Generate presigned URL for S3 upload
        const presignedUrl = s3.getSignedUrl('putObject', {
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
            Expires: 300, // 5 minutes
            Metadata: {
                'user-id': userId || 'anonymous',
                'upload-timestamp': new Date().toISOString()
            }
        });
        
        console.log('Generated presigned URL for:', key);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify({
                presignedUrl,
                key,
                bucket,
                expiresIn: 300
            })
        };
        
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        
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
