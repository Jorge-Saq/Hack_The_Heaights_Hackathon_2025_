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
                
                const userId = keyParts[1]; // This is the Cognito username (email)
                const photoFilename = keyParts[2];
                
                // Extract photo index from filename (e.g., "1.jpg" -> "1")
                const photoIndex = photoFilename.split('.')[0];
                
                console.log(`Processing photo ${photoIndex} for user ${userId}`);
                
                // Get S3 object metadata to retrieve user email
                let userEmail = userId; // Default to userId which should be email
                try {
                    const headParams = {
                        Bucket: bucket,
                        Key: key
                    };
                    const headResult = await s3.headObject(headParams).promise();
                    userEmail = headResult.Metadata['user-email'] || headResult.Metadata['userEmail'] || userId;
                    console.log('User email from metadata:', userEmail);
                } catch (error) {
                    console.error('Error reading S3 metadata:', error);
                }
                
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
                
                try {
                    const indexResult = await rekognition.indexFaces(indexFacesParams).promise();
                    
                    if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
                        const faceRecord = indexResult.FaceRecords[0];
                        const faceId = faceRecord.Face.FaceId;
                        
                        console.log(`Successfully indexed face ${faceId} for user ${userId}`);
                        
                        // Update user profile in DynamoDB
                        await updateUserProfile(userId, key, faceId, photoIndex, userEmail);
                        
                    } else {
                        console.log(`No face detected in photo: ${key}`);
                        
                        // Still update the user profile but mark as no face detected
                        await updateUserProfile(userId, key, null, photoIndex, userEmail);
                    }
                } catch (rekError) {
                    console.error('Rekognition indexing error:', rekError);
                    
                    // If collection doesn't exist, log a helpful message
                    if (rekError.code === 'ResourceNotFoundException') {
                        console.error(`Rekognition collection ${process.env.REKOGNITION_COLLECTION_ID} not found. Please create it first.`);
                    }
                    
                    // Still update profile with error info
                    await updateUserProfile(userId, key, null, photoIndex, userEmail, rekError.message);
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

async function updateUserProfile(userId, s3Key, faceId, photoIndex, userEmail, errorMessage = null) {
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
            email: userEmail,
            profile_photos: [],
            face_ids: [],
            created_at: new Date().toISOString()
        };
        
        // Ensure email is set
        if (!profileData.email && userEmail) {
            profileData.email = userEmail;
        }
        
        // Update profile photos array
        if (!profileData.profile_photos) {
            profileData.profile_photos = [];
        }
        
        // Add or update the photo entry
        const photoEntry = {
            s3_key: s3Key,
            photo_index: photoIndex,
            face_id: faceId,
            uploaded_at: new Date().toISOString(),
            error: errorMessage || undefined
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
