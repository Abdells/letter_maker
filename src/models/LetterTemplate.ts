import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for TypeScript (helps with autocompletion & errors)
export interface ILetterTemplate extends Document {
  category: string;          // e.g., "teachers", "nurses"
  type: string;              // e.g., "Recommendation Letter", "Sick Leave"
  title: string;             // Display name, e.g., "Teacher's Recommendation for Student"
  description?: string;      // Optional short note
  content: string;           // The full letter text with {{placeholders}}
  placeholders: string[];    // Array of expected vars, e.g., ["fullName", "date", "schoolName"]
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const letterTemplateSchema = new Schema<ILetterTemplate>(
  {
    category: {
      type: String,
      required: true,
      lowercase: true,       // Normalize to lowercase
      enum: ['teachers', 'nurses'], // Add more later as we expand professions
    },
    type: {
      type: String,
      required: true,
      unique: true,          // Prevent duplicate types
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    placeholders: {
      type: [String],        // e.g., ["fullName", "date", "recipient", "staffId"]
      default: [],
    },
  },
  {
    timestamps: true,        // Auto-adds createdAt & updatedAt
  }
);

// Export the model
const LetterTemplate = mongoose.models.LetterTemplate || mongoose.model<ILetterTemplate>('LetterTemplate', letterTemplateSchema);

export default LetterTemplate;