import api from './client';

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/google', { credential });
  // Map _id to id if needed
  if (data.user._id && !data.user.id) {
    data.user.id = data.user._id;
  }
  return data;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get('/auth/me');
  if (data._id && !data.id) {
    data.id = data._id;
  }
  return data;
}
