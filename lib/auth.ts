import { auth } from './supabaseClient';

export const getCurrentUser = async () => {
  try {
    // Use getUser instead of getSession for secure verification
    const { data: { user }, error } = await auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const signInWithGoogle = async () => {
  const { data, error } = await auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await auth.signOut();
  if (error) throw error;
};

// Add new function to check and refresh session
export const checkSession = async () => {
  try {
    const { data: { user }, error } = await auth.getUser();
    if (error) throw error;
    
    const { data: { session } } = await auth.getSession();
    return { session, user };
  } catch (error) {
    console.error('Session check error:', error);
    return { session: null, user: null };
  }
};
