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
                if (keyParts.length < 3 || keyParts[0] !== 'event-photos') {
                    console.log('Skipping non-event photo:', key);
                    continue;
                }
                
                const eventId = keyParts[1];
                const photoName = keyParts[2];
                
                // Detect faces in the event photo
                const detectFacesParams = {
                    Image: {
                        S3Object: {
                            Bucket: bucket,
                            Name: key
                        }
                    },
                    Attributes: ['ALL'],
                    MaxFaces: 50
                };
                
                console.log('Detecting faces in event photo...');
                const detectResult = await rekognition.detectFaces(detectFacesParams).promise();
                
                if (detectResult.FaceDetails && detectResult.FaceDetails.length > 0) {
                    console.log(`Found ${detectResult.FaceDetails.length} faces in event photo`);
                    
                    // Search for matches in the face collection
                    const matches = await searchFacesInCollection(detectResult.FaceDetails, bucket, key);
                    
                    if (matches.length > 0) {
                        console.log(`Found ${matches.length} matches in event photo`);
                        
                        // Process each match
                        for (const match of matches) {
                            await processMatch(match, eventId, key, photoName);
                        }
                    } else {
                        console.log('No matches found in event photo');
                    }
                } else {
                    console.log('No faces detected in event photo');
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

async function searchFacesInCollection(faceDetails, bucket, key) {
    const matches = [];
    
    for (let i = 0; i < faceDetails.length; i++) {
        const face = faceDetails[i];
        
        try {
            // Search for this face in the collection
            const searchParams = {
                CollectionId: process.env.REKOGNITION_COLLECTION_ID,
                Image: {
                    S3Object: {
                        Bucket: bucket,
                        Name: key
                    }
                },
                FaceMatchThreshold: 80, // Minimum confidence threshold
                MaxFaces: 5
            };
            
            const searchResult = await rekognition.searchFacesByImage(searchParams).promise();
            
            if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
                for (const faceMatch of searchResult.FaceMatches) {
                    if (faceMatch.Similarity >= 80) { // High confidence match
                        matches.push({
                            faceIndex: i,
                            matchedFace: faceMatch.Face,
                            similarity: faceMatch.Similarity,
                            boundingBox: face.BoundingBox
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error searching for face ${i}:`, error);
        }
    }
    
    return matches;
}

async function processMatch(match, eventId, s3Key, photoName) {
    try {
        const matchId = uuidv4();
        const userId = match.matchedFace.ExternalImageId.split('_')[0];
        const photoIndex = match.matchedFace.ExternalImageId.split('_')[1];
        
        // Get user profile to get email
        const userProfile = await getUserProfile(userId);
        if (!userProfile) {
            console.log(`User profile not found for ${userId}`);
            return;
        }
        
        // Create match record in DynamoDB
        const matchRecord = {
            match_id: matchId,
            cognito_user_id: userId,
            event_id: eventId,
            event_photo_s3_key: s3Key,
            photo_name: photoName,
            face_bounding_box: {
                left: match.boundingBox.Left,
                top: match.boundingBox.Top,
                width: match.boundingBox.Width,
                height: match.boundingBox.Height
            },
            match_confidence: match.similarity,
            face_id: match.matchedFace.FaceId,
            status: 'new',
            created_at: new Date().toISOString()
        };
        
        const putParams = {
            TableName: process.env.MATCHED_PHOTOS_TABLE,
            Item: matchRecord
        };
        
        await dynamodb.put(putParams).promise();
        
        console.log(`Created match record ${matchId} for user ${userId}`);
        
        // Send email notification
        await sendMatchNotification(userProfile, matchRecord);
        
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

async function sendMatchNotification(userProfile, matchRecord) {
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
                                <body>
                                    <h2>You've been spotted in a crowd photo!</h2>
                                    <p>Hello ${userProfile.name || 'there'},</p>
                                    <p>We found you in a new crowd photo with ${matchRecord.match_confidence.toFixed(1)}% confidence!</p>
                                    <p>Event ID: ${matchRecord.event_id}</p>
                                    <p>Photo: ${matchRecord.photo_name}</p>
                                    <p>Check your gallery to see the photo and accept or decline the identification.</p>
                                    <p>Best regards,<br>Crowd Catcher Team</p>
                                </body>
                            </html>
                        `
                    },
                    Text: {
                        Charset: 'UTF-8',
                        Data: `You've been spotted in a crowd photo! We found you in a new crowd photo with ${matchRecord.match_confidence.toFixed(1)}% confidence. Event ID: ${matchRecord.event_id}, Photo: ${matchRecord.photo_name}. Check your gallery to see the photo.`
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'You\'ve been spotted in a crowd photo!'
                }
            },
            Source: process.env.SES_FROM_EMAIL || 'noreply@crowd-catcher.com'
        };
        
        await ses.sendEmail(emailParams).promise();
        console.log(`Sent match notification email to ${userProfile.email}`);
        
    } catch (error) {
        console.error('Error sending match notification:', error);
    }
}
