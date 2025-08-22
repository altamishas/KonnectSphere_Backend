import { Response } from "express";
import AuthCookieManager from "./authCookieManager";

export const clearAuthCookie = (res: Response) => {
  AuthCookieManager.clearAuthCookies(res);
};

export const addCookie = (res: Response, token: string) => {
  AuthCookieManager.setAuthCookie(res, token);
};
