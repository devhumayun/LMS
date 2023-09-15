import { Schema, model, Document } from "mongoose";

export interface FaqItme extends Document {
  question: string;
  answer: string;
}

export interface Category extends Document {
  title: string;
}

export interface BannerImage extends Document {
  public_id: string;
  url: string;
}

interface Layout extends Document {
  type: string;
  faq: FaqItme[];
  categories: Category[];
  banner: {
    image: BannerImage;
    title: string;
    subTitle: string;
  };
}

const faqSchema = new Schema<FaqItme>({
  question: {
    type: String,
  },
  answer: {
    type: String,
  },
});

const categorySchema = new Schema<Category>({
  title: {
    type: String,
  },
});

const bannerImageSchema = new Schema<BannerImage>({
  public_id: {
    type: String,
  },
  url: {
    type: String,
  },
});

const layoutSchema = new Schema<Layout>({
  type: String,
  faq: [faqSchema],
  categories: [categorySchema],
  banner: {
    image: bannerImageSchema,
    title: { type: String },
    subTitle: { type: String },
  },
});

const LayoutModel = model<Layout>("Layout", layoutSchema);

export default LayoutModel;
