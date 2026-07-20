import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,   // creates a unique index — real defense against duplicates
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,  // never returned by queries unless explicitly asked
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationTokenHash: {
      type: String,
      select: false,
    },
    verificationTokenExpiresAt: {
        type: Date,
        select: false,
    },

    // Password reset
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetTokenExpiresAt: {
        type: Date,
        select: false,
    },

    // Refresh token (hashed). Multi-session
    refreshTokenHash: {
        type: [
                {
                     tokenHash: { type: String, required: true },
                     expiresAt: { type: Date, required: true },
                     createdAt: { type: Date, default: Date.now },
                },
            ],
        select: false,
    },
  },
  { timestamps: true }  // createdAt, updatedAt —  always add
);

export const User = mongoose.model("User", userSchema);