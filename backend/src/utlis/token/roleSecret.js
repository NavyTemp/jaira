export const getRoleSecrets = (role) => {
  if (role === "admin") {
    return process.env.SIGNATURE_ADMIN;
  }
  return process.env.SIGNATURE_USER;
};