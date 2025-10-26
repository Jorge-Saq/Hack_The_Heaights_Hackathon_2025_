const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));
        
        // Get user ID from the request context (set by API Gateway authorizer)
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
        
        // Query matched photos for this user
        const queryParams = {
            TableName: process.env.MATCHED_PHOTOS_TABLE,
            IndexName: 'UserPhotosIndex',
            KeyConditionExpression: 'cognito_user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false, // Sort by timestamp descending (newest first)
            Limit: 50 // Limit to 50 most recent matches
        };
        
        console.log('Querying matched photos for user:', userId);
        const result = await dynamodb.query(queryParams).promise();
        
        // Process the results and generate presigned URLs for photos
        const galleryPhotos = await Promise.all(
            result.Items.map(async (match) => processGalleryPhoto(match))
        );
        
        console.log(`Found ${galleryPhotos.length} photos for user ${userId}`);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify({
                photos: galleryPhotos,
                total: galleryPhotos.length
            })
        };
        
    } catch (error) {
        console.error('Error getting gallery photos:', error);
        
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

async function processGalleryPhoto(match) {
    try {
        // Generate presigned URL for the event photo
        const eventPhotoUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.EVENT_PHOTOS_BUCKET,
            Key: match.event_photo_s3_key,
            Expires: 3600 // 1 hour
        });
        
        // Generate presigned URL for cropped face thumbnail (if exists)
        let faceThumbnailUrl = null;
        if (match.face_thumbnail_s3_key) {
            faceThumbnailUrl = s3.getSignedUrl('getObject', {
                Bucket: process.env.EVENT_PHOTOS_BUCKET,
                Key: match.face_thumbnail_s3_key,
                Expires: 3600
            });
        }
        
        return {
            match_id: match.match_id,
            event_id: match.event_id,
            photo_name: match.photo_name,
            event_photo_url: eventPhotoUrl,
            face_thumbnail_url: faceThumbnailUrl,
            face_bounding_box: match.face_bounding_box,
            match_confidence: match.match_confidence,
            status: match.status,
            created_at: match.created_at,
            // Add face detection details for UI
            face_details: {
                confidence: match.match_confidence,
                bounding_box: match.face_bounding_box
            }
        };
        
    } catch (error) {
        console.error('Error processing gallery photo:', error);
        return {
            match_id: match.match_id,
            error: 'Failed to generate photo URL'
        };
    }
}
