import jwtDecode from "jwt-decode"

export const decodeToken = (token) => {
  return jwtDecode(token);
}

export const getSubDataFromToken = (token) => {
  return JSON.parse(decodeToken(token).sub);
}