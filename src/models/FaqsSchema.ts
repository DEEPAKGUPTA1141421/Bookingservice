import mongoose, { Schema, Document } from "mongoose";

interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface IFaq extends Document {
  category: string;
  faqs: QuestionAnswer[];
}

const FaqSchema: Schema = new Schema(
  {
    category: { type: String, required: true, unique: true },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const FaqModel = mongoose.model<IFaq>("Faq", FaqSchema);
