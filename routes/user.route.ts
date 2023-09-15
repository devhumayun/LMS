import express from "express";
import {
  activateUser,
  getAllusers,
  getUserInfo,
  loginUser,
  logout,
  socialLogin,
  updateAccessToken,
  updateUserInfo,
  updateUserProfile,
  updateUserRole,
  updatepassword,
  userRegistration,
} from "../controller/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const router = express.Router();

// user api route
router.post("/registration", userRegistration);
router.post("/activate-user", activateUser);
router.post("/login", loginUser);
router.get("/logout", isAuthenticated, logout);
router.get("/refresh-token", updateAccessToken);
router.get("/me", isAuthenticated, getUserInfo);
router.post("/social-login", socialLogin);
router.put("/update-user", isAuthenticated, updateUserInfo);
router.put("/update-password", isAuthenticated, updatepassword);
router.put("/update-profile", isAuthenticated, updateUserProfile);
router.get("/all-users", isAuthenticated, authorizeRoles("admin"), getAllusers);
router.put(
  "/update-role",
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRole
);

export default router;
