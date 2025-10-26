const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();

exports.handler = async (event) => {
    try {
        console.log('S3 Event:', JSON.stringify(event, null, 2));
        
        // Process each S3 record
        for (const record of event.Records) {
            if (record.eventName.startsWith('ObjectCreated')) {
                const bucket = record.s3.bucket.name;
                const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
                
                console.log(`Processing new event photo: ${bucket}/${key}`);
                
                // Extract event ID from the S3 key (format: event-photos/{eventId}/photo.jpg)
                const keyParts = key.split('/');
                if (keyParts.length < 2 || keyParts[0] !== 'event-photos') {
                    console.log('Skipping non-event photo:', key);
                    continue;
                }
                
                const eventId = keyParts[1];
                const photoName = keyParts.slice(2).join('/'); // Handle filenames with slashes
                
                // Get S3 object metadata to retrieve uploader email
                let uploaderEmail = null;
                try {
                    const headParams = {
                        Bucket: bucket,
                        Key: key
                    };
                    const headResult = await s3.headObject(headParams).promise();
                    uploaderEmail = headResult.Metadata['uploader-email'] || headResult.Metadata['uploaderEmail'];
                    console.log('Uploader email from metadata:', uploaderEmail);
                } catch (error) {
                    console.error('Error reading S3 metadata:', error);
                }
                
                // Search for faces directly using SearchFacesByImage
                // This is more efficient than DetectFaces + individual searches
                const searchParams = {
                    CollectionId: process.env.REKOGNITION_COLLECTION_ID,
                    Image: {
                        S3Object: {
                            Bucket: bucket,
                            Name: key
                        }
                    },
                    FaceMatchThreshold: 80, // 80% confidence minimum
                    MaxFaces: 50 // Search for up to 50 faces in the photo
                };
                
                console.log('Searching for faces in collection...');
                const searchResult = await rekognition.searchFacesByImage(searchParams).promise();
                
                if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
                    console.log(`Found ${searchResult.FaceMatches.length} face matches in event photo`);
                    
                    // Process each match
                    for (const faceMatch of searchResult.FaceMatches) {
                        await processMatch(faceMatch, eventId, key, photoName, bucket, uploaderEmail);
                    }
                } else {
                    console.log('No matching faces found in event photo');
                }
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Event photo processing completed successfully'
            })
        };
        
    } catch (error) {
        console.error('Error processing event photo:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function processMatch(faceMatch, eventId, s3Key, photoName, bucket, uploaderEmail) {
    try {
        const matchId = uuidv4();
        
        // Extract user ID from the ExternalImageId (format: {userId}_{photoIndex})
        const externalImageId = faceMatch.Face.ExternalImageId;
        if (!externalImageId || !externalImageId.includes('_')) {
            console.log('Invalid ExternalImageId format:', externalImageId);
            return;
        }
        
        const userId = externalImageId.split('_')[0];
        
        console.log(`Processing match for user ${userId} with ${faceMatch.Similarity.toFixed(2)}% confidence`);
        
        // Get user profile to get email and name
        const userProfile = await getUserProfile(userId);
        if (!userProfile || !userProfile.email) {
            console.log(`User profile or email not found for ${userId}`);
            return;
        }
        
        // Create match record in DynamoDB
        const matchRecord = {
            match_id: matchId,
            cognito_user_id: userId,
            event_id: eventId,
            event_photo_s3_key: s3Key,
            photo_name: photoName,
            face_bounding_box: faceMatch.Face.BoundingBox,
            match_confidence: faceMatch.Similarity,
            face_id: faceMatch.Face.FaceId,
            uploader_email: uploaderEmail || 'unknown',
            status: 'new',
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        const putParams = {
            TableName: process.env.MATCHED_PHOTOS_TABLE,
            Item: matchRecord
        };
        
        await dynamodb.put(putParams).promise();
        
        console.log(`Created match record ${matchId} for user ${userId}`);
        
        // Generate presigned URL for the photo (valid for 7 days)
        const presignedUrl = await s3.getSignedUrlPromise('getObject', {
            Bucket: bucket,
            Key: s3Key,
            Expires: 604800 // 7 days in seconds
        });
        
        // Send email notification with the photo
        await sendMatchNotification(userProfile, matchRecord, presignedUrl);
        
    } catch (error) {
        console.error('Error processing match:', error);
    }
}

async function getUserProfile(userId) {
    try {
        const getParams = {
            TableName: process.env.USER_PROFILES_TABLE,
            Key: { cognito_user_id: userId }
        };
        
        const result = await dynamodb.get(getParams).promise();
        return result.Item;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

async function sendMatchNotification(userProfile, matchRecord, presignedUrl) {
    try {
        const emailParams = {
            Destination: {
                ToAddresses: [userProfile.email]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: `
                            <html>
                                <head>
                                    <style>
                                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                                        .confidence { background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                                        .photo-preview { max-width: 100%; border-radius: 8px; margin: 20px 0; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="header">
                                            <h1>📸 You've Been Spotted!</h1>
                                        </div>
                                        <div class="content">
                                            <p>Hello ${userProfile.name || 'there'},</p>
                                            <p>Great news! Our AI detected you in a crowd photo that was just uploaded.</p>
                                            <div class="confidence">
                                                Match Confidence: ${matchRecord.match_confidence.toFixed(1)}%
                                            </div>
                                            <p><strong>Photo Details:</strong></p>
                                            <ul>
                                                <li>Event ID: ${matchRecord.event_id}</li>
                                                <li>Photo: ${matchRecord.photo_name}</li>
                                                <li>Uploaded by: ${matchRecord.uploader_email}</li>
                                            </ul>
                                            <p>Click the button below to view and download your photo:</p>
                                            <a href="${presignedUrl}" class="button">View Your Photo</a>
                                            <p style="font-size: 12px; color: #666; margin-top: 30px;">
                                                This link will expire in 7 days. You can also view this photo in your Crowd Catcher gallery.
                                            </p>
                                            <p>Best regards,<br><strong>Crowd Catcher Team</strong></p>
                                        </div>
                                    </div>
                                </body>
                            </html>
                        `
                    },
                    Text: {
                        Charset: 'UTF-8',
                        Data: `You've been spotted in a crowd photo!\n\nHello ${userProfile.name || 'there'},\n\nWe found you in a new crowd photo with ${matchRecord.match_confidence.toFixed(1)}% confidence.\n\nEvent ID: ${matchRecord.event_id}\nPhoto: ${matchRecord.photo_name}\nUploaded by: ${matchRecord.uploader_email}\n\nView your photo: ${presignedUrl}\n\n(This link expires in 7 days)\n\nBest regards,\nCrowd Catcher Team`
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: '📸 You\'ve Been Spotted in a Crowd Photo!'
                }
            },
            Source: process.env.SES_FROM_EMAIL
        };
        
        await ses.sendEmail(emailParams).promise();
        console.log(`Sent match notification email to ${userProfile.email}`);
        
    } catch (error) {
        console.error('Error sending match notification:', error);
        // Don't throw - we don't want email failures to stop processing
    }
}
