import { z } from 'zod';
import { LIMITS } from '../constants';

export const phoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Invalid phone number format. Must include country code.');

export const usernameSchema = z
  .string()
  .min(LIMITS.USERNAME_MIN_LENGTH, `Username must be at least ${LIMITS.USERNAME_MIN_LENGTH} characters`)
  .max(LIMITS.USERNAME_MAX_LENGTH, `Username must be at most ${LIMITS.USERNAME_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Username must start with a letter and contain only letters, numbers, and underscores');

export const displayNameSchema = z
  .string()
  .min(LIMITS.DISPLAY_NAME_MIN_LENGTH, 'Display name is required')
  .max(LIMITS.DISPLAY_NAME_MAX_LENGTH, `Display name must be at most ${LIMITS.DISPLAY_NAME_MAX_LENGTH} characters`)
  .trim();

export const bioSchema = z
  .string()
  .max(LIMITS.BIO_MAX_LENGTH, `Bio must be at most ${LIMITS.BIO_MAX_LENGTH} characters`)
  .trim()
  .optional();

export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(LIMITS.MESSAGE_MAX_LENGTH, `Message must be at most ${LIMITS.MESSAGE_MAX_LENGTH} characters`);

export const otpSchema = z
  .string()
  .length(LIMITS.OTP_LENGTH, `Verification code must be ${LIMITS.OTP_LENGTH} digits`)
  .regex(/^\d+$/, 'Verification code must contain only digits');

export const verificationRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const loginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  verificationCode: otpSchema,
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(128),
  platform: z.enum(['ios', 'android']),
});

export const registerSchema = z.object({
  phoneNumber: phoneNumberSchema,
  displayName: displayNameSchema,
  verificationCode: otpSchema,
  publicKey: z.string().min(1),
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(128),
  platform: z.enum(['ios', 'android']),
});

export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  username: usernameSchema.nullable().optional(),
  bio: bioSchema.nullable(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(LIMITS.CHAT_NAME_MAX_LENGTH),
  description: z.string().max(LIMITS.CHAT_DESCRIPTION_MAX_LENGTH).optional(),
  memberIds: z.array(z.string().uuid()).min(1).max(LIMITS.GROUP_MAX_MEMBERS - 1),
});

export const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  localId: z.string().uuid(),
  type: z.enum(['text', 'image', 'video', 'audio', 'voice_note', 'document', 'location', 'contact', 'sticker', 'system']),
  encryptedContent: z.string().min(1),
  replyToId: z.string().uuid().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

export const searchSchema = paginationSchema.extend({
  query: z.string().min(1).max(256).trim(),
});
