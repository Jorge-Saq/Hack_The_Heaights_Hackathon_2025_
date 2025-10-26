const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        console.log('S3 Event:', JSON.stringify(event, null, 2));
        
        // Process each S3 record
        for (const record of event.Records) {
            if (record.eventName.startsWith('ObjectCreated')) {
                const bucket = record.s3.bucket.name;
                const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
                
                console.log(`Processing new user profile photo: ${bucket}/${key}`);
                
                // Extract user ID from the S3 key (format: user-profiles/{userId}/photo.jpg)
                const keyParts = key.split('/');
                if (keyParts.length < 3 || keyParts[0] !== 'user-profiles') {
                    console.log('Skipping non-user-profile photo:', key);
                    continue;
                }
                
                const userId = keyParts[1];
                const photoIndex = keyParts[2];
                
                // Get the image from S3
                const s3Object = await s3.getObject({
                    Bucket: bucket,
                    Key: key
                }).promise();
                
                // Index the face in Rekognition
                const indexFacesParams = {
                    CollectionId: process.env.REKOGNITION_COLLECTION_ID,
                    Image: {
                        S3Object: {
                            Bucket: bucket,
                            Name: key
                        }
                    },
                    ExternalImageId: `${userId}_${photoIndex}`,
                    MaxFaces: 1,
                    QualityFilter: 'AUTO',
                    DetectionAttributes: ['ALL']
                };
                
                console.log('Indexing face with params:', JSON.stringify(indexFacesParams, null, 2));
                
                const indexResult = await rekognition.indexFaces(indexFacesParams).promise();
                
                if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
                    const faceRecord = indexResult.FaceRecords[0];
                    const faceId = faceRecord.Face.FaceId;
                    
                    console.log(`Successfully indexed face ${faceId} for user ${userId}`);
                    
                    // Update user profile in DynamoDB
                    await updateUserProfile(userId, key, faceId, photoIndex);
                    
                } else {
                    console.log(`No face detected in photo: ${key}`);
                    
                    // Still update the user profile but mark as no face detected
                    await updateUserProfile(userId, key, null, photoIndex);
                }
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User face indexing completed successfully'
            })
        };
        
    } catch (error) {
        console.error('Error indexing user face:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function updateUserProfile(userId, s3Key, faceId, photoIndex) {
    try {
        const tableName = process.env.USER_PROFILES_TABLE;
        
        // Get current user profile
        const getParams = {
            TableName: tableName,
            Key: { cognito_user_id: userId }
        };
        
        const existingProfile = await dynamodb.get(getParams).promise();
        
        let profileData = existingProfile.Item || {
            cognito_user_id: userId,
            profile_photos: [],
            face_ids: [],
            created_at: new Date().toISOString()
        };
        
        // Update profile photos array
        if (!profileData.profile_photos) {
            profileData.profile_photos = [];
        }
        
        // Add or update the photo entry
        const photoEntry = {
            s3_key: s3Key,
            photo_index: photoIndex,
            face_id: faceId,
            uploaded_at: new Date().toISOString()
        };
        
        // Find existing photo entry or add new one
        const existingPhotoIndex = profileData.profile_photos.findIndex(
            photo => photo.photo_index === photoIndex
        );
        
        if (existingPhotoIndex >= 0) {
            profileData.profile_photos[existingPhotoIndex] = photoEntry;
        } else {
            profileData.profile_photos.push(photoEntry);
        }
        
        // Update face IDs array
        if (faceId) {
            if (!profileData.face_ids) {
                profileData.face_ids = [];
            }
            
            if (!profileData.face_ids.includes(faceId)) {
                profileData.face_ids.push(faceId);
            }
        }
        
        profileData.updated_at = new Date().toISOString();
        
        // Save to DynamoDB
        const putParams = {
            TableName: tableName,
            Item: profileData
        };
        
        await dynamodb.put(putParams).promise();
        
        console.log(`Updated user profile for ${userId} with ${profileData.profile_photos.length} photos`);
        
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}
