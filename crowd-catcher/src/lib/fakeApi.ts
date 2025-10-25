import { cosineSimilarity, generateRandomEmbedding, averageEmbeddings } from '@/utils/cosine';

// Types
export interface User {
  id: string;
  email: string;
  studentId: string;
  password: string;
  faceEmbedding?: number[];
  enrolledAt?: Date;
}

export interface Photo {
  id: string;
  filename: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  faceEmbeddings: number[][];
  confirmedBy: string[];
  rejectedBy: string[];
}

export interface Match {
  id: string;
  userId: string;
  photoId: string;
  similarity: number;
  confirmed: boolean;
  rejected: boolean;
  createdAt: Date;
}

// In-memory storage
let users: User[] = [];
let photos: Photo[] = [];
let matches: Match[] = [];
let currentUser: User | null = null;

// Simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fakeApi = {
  // Authentication
  async signUp({ email, studentId, password }: { email: string; studentId: string; password: string }) {
    await delay(500);
    
    // Check if user already exists
    if (users.find(u => u.email === email || u.studentId === studentId)) {
      throw new Error('User already exists');
    }

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      studentId,
      password,
    };

    users.push(user);
    currentUser = user;
    return user;
  },

  async login({ email, studentId, password }: { email: string; studentId: string; password: string }) {
    await delay(500);
    
    const user = users.find(u => 
      (u.email === email || u.studentId === studentId) && u.password === password
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    currentUser = user;
    return user;
  },

  async getCurrentUser() {
    return currentUser;
  },

  async logout() {
    currentUser = null;
  },

  // Face enrollment
  async enrollFaceSet(files: File[]) {
    await delay(1000);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    if (files.length < 10) {
      throw new Error('Please upload at least 10 face photos');
    }

    // Generate random embeddings for each uploaded file
    const embeddings = files.map(() => generateRandomEmbedding());
    const averageEmbedding = averageEmbeddings(embeddings);

    // Update user with face embedding
    const userIndex = users.findIndex(u => u.id === currentUser!.id);
    if (userIndex !== -1) {
      users[userIndex].faceEmbedding = averageEmbedding;
      users[userIndex].enrolledAt = new Date();
    }

    return { success: true, embeddingCount: embeddings.length };
  },

  // Photo upload
  async uploadPhotos(files: File[]) {
    await delay(1500);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const uploadedPhotos: Photo[] = [];

    for (const file of files) {
      // Generate random face embeddings for each photo (simulating face detection)
      const faceCount = Math.floor(Math.random() * 5) + 1; // 1-5 faces per photo
      const faceEmbeddings = Array.from({ length: faceCount }, () => generateRandomEmbedding());

      const photo: Photo = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date(),
        uploadedBy: currentUser.id,
        faceEmbeddings,
        confirmedBy: [],
        rejectedBy: [],
      };

      photos.push(photo);
      uploadedPhotos.push(photo);
    }

    // Find matches for all enrolled users
    await this.findMatchesForPhotos(uploadedPhotos);

    return uploadedPhotos;
  },

  // Find matches for uploaded photos
  async findMatchesForPhotos(uploadedPhotos: Photo[]) {
    const enrolledUsers = users.filter(u => u.faceEmbedding);
    
    for (const photo of uploadedPhotos) {
      for (const user of enrolledUsers) {
        if (!user.faceEmbedding) continue;

        let bestSimilarity = 0;
        for (const faceEmbedding of photo.faceEmbeddings) {
          const similarity = cosineSimilarity(user.faceEmbedding, faceEmbedding);
          bestSimilarity = Math.max(bestSimilarity, similarity);
        }

        // If similarity is above threshold, create a match
        if (bestSimilarity > 0.45) {
          const match: Match = {
            id: Math.random().toString(36).substr(2, 9),
            userId: user.id,
            photoId: photo.id,
            similarity: bestSimilarity,
            confirmed: false,
            rejected: false,
            createdAt: new Date(),
          };
          matches.push(match);
        }
      }
    }
  },

  // Get proposed matches for current user
  async proposeMatchesForUser(userId: string) {
    await delay(300);
    
    const userMatches = matches.filter(m => 
      m.userId === userId && !m.confirmed && !m.rejected
    );

    return userMatches.map(match => {
      const photo = photos.find(p => p.id === match.photoId);
      return {
        ...match,
        photo,
      };
    }).filter(match => match.photo);
  },

  // Confirm a match
  async confirmMatch({ userId, photoId }: { userId: string; photoId: string }) {
    await delay(300);
    
    const match = matches.find(m => m.userId === userId && m.photoId === photoId);
    if (match) {
      match.confirmed = true;
    }

    const photo = photos.find(p => p.id === photoId);
    if (photo && !photo.confirmedBy.includes(userId)) {
      photo.confirmedBy.push(userId);
    }

    return { success: true };
  },

  // Reject a match
  async rejectMatch({ userId, photoId }: { userId: string; photoId: string }) {
    await delay(300);
    
    const match = matches.find(m => m.userId === userId && m.photoId === photoId);
    if (match) {
      match.rejected = true;
    }

    const photo = photos.find(p => p.id === photoId);
    if (photo && !photo.rejectedBy.includes(userId)) {
      photo.rejectedBy.push(userId);
    }

    return { success: true };
  },

  // Get user's gallery
  async getMyGallery(userId: string) {
    await delay(300);
    
    const userMatches = matches.filter(m => 
      m.userId === userId && m.confirmed
    );

    return userMatches.map(match => {
      const photo = photos.find(p => p.id === match.photoId);
      return {
        ...match,
        photo,
      };
    }).filter(match => match.photo);
  },

  // Send review emails (simulated)
  async sendReviewEmail({ userId, count }: { userId: string; count: number }) {
    await delay(500);
    
    // In a real app, this would send actual emails
    console.log(`📧 Simulated email sent to user ${userId} about ${count} potential matches`);
    
    return { success: true, emailsSent: count };
  },

  // Get upload statistics
  async getUploadStats() {
    await delay(200);
    
    const totalPhotos = photos.length;
    const totalFaces = photos.reduce((sum, photo) => sum + photo.faceEmbeddings.length, 0);
    const totalMatches = matches.length;
    
    return {
      uploadedCount: totalPhotos,
      facesDetected: totalFaces,
      matchesFound: totalMatches,
    };
  },
};
