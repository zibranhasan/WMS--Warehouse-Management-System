import { envVars } from "../config/env";
import { jwtUtils } from "./jwt";
import { CookieUtils } from "./cookie";
//Creating access token
const getAccessToken = (payload) => {
    const accessToken = jwtUtils.createToken(payload, envVars.ACCESS_TOKEN_SECRET, { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN });
    return accessToken;
};
const getRefreshToken = (payload) => {
    const refreshToken = jwtUtils.createToken(payload, envVars.REFRESH_TOKEN_SECRET, { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN });
    return refreshToken;
};
const setAccessTokenCookie = (res, token) => {
    CookieUtils.setCookie(res, "accessToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        //1 day
        maxAge: 60 * 60 * 24 * 1000,
    });
};
const setRefreshTokenCookie = (res, token) => {
    CookieUtils.setCookie(res, "refreshToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        //7d
        maxAge: 60 * 60 * 24 * 1000 * 7,
    });
};
const setBetterAuthSessionCookie = (res, token) => {
    CookieUtils.setCookie(res, "better-auth.session_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        //1 day
        maxAge: 60 * 60 * 24 * 1000,
    });
};
export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie,
};
