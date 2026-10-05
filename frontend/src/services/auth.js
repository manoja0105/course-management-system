const TOKEN_KEY = "token";
const USER_KEY = "user";


// =====================================================
// SAVE AUTH
// =====================================================

export function saveAuth(token, user) {

  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}


// =====================================================
// GET TOKEN
// =====================================================

export function getToken() {

  return localStorage.getItem(
    TOKEN_KEY
  );
}


// =====================================================
// GET USER
// =====================================================

export function getUser() {

  const userJson =
    localStorage.getItem(USER_KEY);


  if (!userJson) {
    return null;
  }


  try {

    return JSON.parse(userJson);

  } catch (error) {

    console.error(
      "Could not read user from localStorage:",
      error.message
    );

    return null;
  }
}


// =====================================================
// CLEAR AUTH
// =====================================================

export function clearAuth() {

  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
}


// =====================================================
// LOGIN CHECK
// =====================================================

export function isLoggedIn() {

  return Boolean(
    getToken() &&
    getUser()
  );
}


// =====================================================
// GET USER ROLE
// =====================================================

export function getUserRole() {

  const user = getUser();

  return user
    ? user.role
    : null;
}


// =====================================================
// ROLE HELPERS
// =====================================================

export function isAdmin() {

  return getUserRole() === "admin";
}


export function isStudent() {

  return getUserRole() === "student";
}