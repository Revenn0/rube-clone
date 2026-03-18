// Mock auth for development - replace with real Clerk auth when keys are configured
export async function auth() {
  // For development, return a mock user
  return {
    userId: 'dev-user-001',
  };
}

export async function currentUser() {
  return {
    id: 'dev-user-001',
    firstName: 'Victor',
    lastName: 'Junger',
    emailAddresses: [{ emailAddress: 'vjunger0@gmail.com' }],
    imageUrl: null,
  };
}
