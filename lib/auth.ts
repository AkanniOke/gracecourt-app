import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type UserRole = 'member' | 'admin';

export const DEFAULT_USER_POSITION = 'Member';
export const DEFAULT_USER_ROLE: UserRole = 'member';

export type UserProfile = {
  avatarUrl: string | null;
  id: string;
  email: string | null;
  fullName: string;
  phone: string;
  position: string;
  role: UserRole;
};

type SyncUserProfileInput = {
  userId: string;
  email: string | null;
  fullName: string;
  phone: string;
  position?: string;
  role?: UserRole;
};

type UserProfileRow = {
  avatar_url: string | null;
  email: string | null;
  full_name: string | null;
  id: string | number;
  phone: string | null;
  position: string | null;
  role: string | null;
};

type UserProfileUpdatePayload = {
  avatar_url?: string | null;
  email?: string | null;
  full_name?: string;
  phone?: string;
  position?: string;
  role?: UserRole;
};

type EnsureUserProfileInput = {
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  user: User;
};

function getStringMetadataValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getProfileDefaults({
  email,
  fullName,
  phone,
  user,
}: EnsureUserProfileInput): SyncUserProfileInput {
  const metadata = user.user_metadata ?? {};
  const metadataFullName = getStringMetadataValue(metadata.full_name);
  const metadataPhone = getStringMetadataValue(metadata.phone);

  return {
    userId: user.id,
    email: email?.trim().toLowerCase() || user.email?.trim().toLowerCase() || null,
    fullName: fullName?.trim() || metadataFullName || 'GraceCourt Member',
    phone: phone?.trim() || metadataPhone,
    position: DEFAULT_USER_POSITION,
    role: DEFAULT_USER_ROLE,
  };
}

function getProfileRepairPayload(
  existingProfile: UserProfileRow,
  profileDefaults: SyncUserProfileInput
) {
  const payload: UserProfileUpdatePayload = {};

  if (!existingProfile.email && profileDefaults.email) {
    payload.email = profileDefaults.email;
  }

  if (!existingProfile.full_name?.trim()) {
    payload.full_name = profileDefaults.fullName;
  }

  if (existingProfile.phone === null && profileDefaults.phone) {
    payload.phone = profileDefaults.phone;
  }

  if (!existingProfile.position?.trim()) {
    payload.position = DEFAULT_USER_POSITION;
  }

  if (existingProfile.role !== 'admin' && existingProfile.role !== 'member') {
    payload.role = DEFAULT_USER_ROLE;
  }

  return payload;
}

export async function syncUserProfile({
  userId,
  email,
  fullName,
  phone,
  position = DEFAULT_USER_POSITION,
  role = DEFAULT_USER_ROLE,
}: SyncUserProfileInput) {
  const { error } = await supabase.from('users').upsert(
    {
      id: userId,
      email: email?.trim().toLowerCase() ?? null,
      full_name: fullName.trim() || 'GraceCourt Member',
      phone: phone.trim(),
      position: position.trim() || DEFAULT_USER_POSITION,
      role,
    },
    {
      onConflict: 'id',
    }
  );

  if (error) {
    throw error;
  }
}

function normalizeUserProfile(data: UserProfileRow): UserProfile {
  return {
    avatarUrl: data.avatar_url ?? null,
    id: String(data.id),
    email: data.email ?? null,
    fullName: data.full_name ?? 'GraceCourt Member',
    phone: data.phone ?? '',
    position: data.position ?? DEFAULT_USER_POSITION,
    role: data.role === 'admin' ? 'admin' : DEFAULT_USER_ROLE,
  };
}

async function fetchUserProfileById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, position, role, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function fetchUserProfileByEmail(userEmail: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, position, role, avatar_url')
    .eq('email', userEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserProfile(userId: string, userEmail?: string | null) {
  const normalizedEmail = userEmail?.trim().toLowerCase() ?? null;

  const profileById = await fetchUserProfileById(userId);

  if (profileById) {
    return normalizeUserProfile(profileById);
  }

  if (!normalizedEmail) {
    return null;
  }

  const profileByEmail = await fetchUserProfileByEmail(normalizedEmail);

  if (!profileByEmail) {
    return null;
  }

  return normalizeUserProfile(profileByEmail);
}

export async function ensureUserProfileExists(input: EnsureUserProfileInput) {
  const profileDefaults = getProfileDefaults(input);
  const existingProfile = await fetchUserProfileById(input.user.id);

  if (existingProfile) {
    const repairPayload = getProfileRepairPayload(existingProfile, profileDefaults);

    if (Object.keys(repairPayload).length === 0) {
      return normalizeUserProfile(existingProfile);
    }

    const { error } = await supabase
      .from('users')
      .update(repairPayload)
      .eq('id', input.user.id);

    if (error) {
      console.error('Failed to repair required user profile fields.', {
        userId: input.user.id,
        error,
      });
      throw error;
    }

    const repairedProfile = await fetchUserProfileById(input.user.id);

    if (!repairedProfile) {
      throw new Error('Profile repair completed but the users row could not be loaded.');
    }

    return normalizeUserProfile(repairedProfile);
  }

  try {
    await syncUserProfile(profileDefaults);
  } catch (error) {
    console.error('Failed to create required user profile row.', {
      email: profileDefaults.email,
      userId: profileDefaults.userId,
      error,
    });
    throw error;
  }

  const createdProfile = await fetchUserProfileById(input.user.id);

  if (!createdProfile) {
    throw new Error('Profile creation completed but the users row could not be loaded.');
  }

  return normalizeUserProfile(createdProfile);
}

export async function updateUserAvatarUrl(userId: string, avatarUrl: string | null) {
  const { error } = await supabase
    .from('users')
    .update({
      avatar_url: avatarUrl,
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}
