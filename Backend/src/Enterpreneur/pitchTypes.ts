import User from "../user/userModel";

export interface Book {
  _id: string;
  title: string;
  author: typeof User;
  genre: string;
  pdfFile: string;
  coverImage: string;
}
